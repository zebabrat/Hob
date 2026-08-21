import { APPLICATION_STATUSES, QUIET_AFTER_DAYS, WORK_FORMATS } from '@hob/shared';
import type { AnalyticsPeriod, AnalyticsResponse } from '@hob/shared';
import { prisma } from '../db.js';
import { Prisma } from '../generated/prisma/client.js';

/** Reached an interview or further along — the one signal "interviewed" means everywhere in this module. */
const REACHED_INTERVIEW_STATUSES = Prisma.sql`('INTERVIEW', 'OFFER', 'ACCEPTED')`;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** One row per distinct string a user has typed (source or role/position), plus how many reached an interview. */
interface BreakdownRow {
  key: string;
  sent: number;
  interviewed: number;
}

/** Applications filed per ISO week. Postgres does the bucketing (date_trunc) — Prisma's groupBy cannot truncate a date. */
interface OverTimeRow {
  period: Date;
  count: number;
}

/**
 * One row per (from, to) pair actually observed in StatusChange — built with
 * a window function (LEAD) to pair each stay's entry with what it led to
 * next, which Prisma's query builder has no way to express.
 */
interface StageTransitionRow {
  from_status: string;
  to_status: string;
  median_days: number | null;
  sample_count: number;
}

interface ResponseBucketRow {
  bucket: string;
  count: number;
}

const RESPONSE_TIME_BUCKETS = ['1-2', '3-4', '5-7', '8-14', '15-21', '22-30', '30+'] as const;

/** The three real forward transitions this app's status model can report on — see the schema comment on ApplicationStatus. */
const TRACKED_TRANSITIONS: [string, string][] = [
  ['APPLIED', 'SCREENING'],
  ['SCREENING', 'INTERVIEW'],
  ['INTERVIEW', 'OFFER'],
];

export async function loadAnalytics(userId: number, period: AnalyticsPeriod): Promise<AnalyticsResponse> {
  const periodStart = period === '30d' ? new Date(Date.now() - THIRTY_DAYS_MS) : null;
  const quietSince = new Date(Date.now() - QUIET_AFTER_DAYS * 24 * 60 * 60 * 1000);
  // Applied to Prisma's query-builder calls.
  const periodWhere = periodStart ? { appliedDate: { gte: periodStart } } : {};
  // Applied inside raw SQL, where the same cutoff is an `a."appliedDate" >= …` fragment (or nothing for "all time").
  const periodSql = periodStart ? Prisma.sql`AND a."appliedDate" >= ${periodStart}` : Prisma.sql``;

  const [
    statusCounts,
    workFormatCounts,
    salaryAgg,
    overTimeRows,
    transitionRows,
    sourceRows,
    sourceUnspecified,
    roleRows,
    responseBucketRows,
    medianResponseRows,
    reachedInterview,
    offersEver,
    noResponse,
    rejectedBeforeInterview,
    rejectedAfterInterview,
    withdrawnCount,
  ] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId, ...periodWhere },
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ['workFormat'],
      where: { userId, ...periodWhere },
      _count: { _all: true },
    }),
    prisma.application.aggregate({
      where: { userId, salary: { not: null }, ...periodWhere },
      _min: { salary: true },
      _max: { salary: true },
      _avg: { salary: true },
      _count: { salary: true },
    }),
    prisma.$queryRaw<OverTimeRow[]>`
      SELECT date_trunc('week', "appliedDate") AS period, COUNT(*)::int AS count
      FROM "Application" a
      WHERE a."userId" = ${userId} ${periodSql}
      GROUP BY period
      ORDER BY period ASC
    `,
    /*
     * For every StatusChange row, "left_at"/"next_status" describe what
     * happened next for the same application (any status — any transition
     * ends the stay), or nothing when the application is still there. The
     * median of (left_at - entered_at), grouped by (status, next_status),
     * is "how long a stage that led to a specific next stage typically
     * takes" — not just "how long this stage lasts on average".
     */
    prisma.$queryRaw<StageTransitionRow[]>`
      WITH stays AS (
        SELECT
          sc."toStatus"::text AS status,
          sc."changedAt" AS entered_at,
          LEAD(sc."changedAt") OVER (PARTITION BY sc."applicationId" ORDER BY sc."changedAt") AS left_at,
          LEAD(sc."toStatus") OVER (PARTITION BY sc."applicationId" ORDER BY sc."changedAt")::text AS next_status
        FROM "StatusChange" sc
        JOIN "Application" a ON a.id = sc."applicationId"
        WHERE a."userId" = ${userId} ${periodSql}
      )
      SELECT
        status AS from_status,
        next_status AS to_status,
        PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (left_at - entered_at)) / 86400.0
        )::float8 AS median_days,
        COUNT(*)::int AS sample_count
      FROM stays
      WHERE left_at IS NOT NULL
      GROUP BY status, next_status
    `,
    /*
     * source is a text[] now (an application can list more than one
     * channel), so grouping by it needs a lateral unnest first — an
     * application with two sources contributes its "sent"/"interviewed"
     * count to both, same fan-out labels would get if grouped on.
     */
    prisma.$queryRaw<BreakdownRow[]>`
      SELECT
        src AS key,
        COUNT(DISTINCT a.id)::int AS sent,
        COUNT(DISTINCT CASE WHEN sc."toStatus"::text IN ${REACHED_INTERVIEW_STATUSES} THEN a.id END)::int AS interviewed
      FROM "Application" a
      CROSS JOIN LATERAL unnest(a.source) AS src
      LEFT JOIN "StatusChange" sc ON sc."applicationId" = a.id
      WHERE a."userId" = ${userId} ${periodSql}
      GROUP BY src
    `,
    prisma.application.count({ where: { userId, source: { isEmpty: true }, ...periodWhere } }),
    prisma.$queryRaw<BreakdownRow[]>`
      SELECT
        a.position AS key,
        COUNT(DISTINCT a.id)::int AS sent,
        COUNT(DISTINCT CASE WHEN sc."toStatus"::text IN ${REACHED_INTERVIEW_STATUSES} THEN a.id END)::int AS interviewed
      FROM "Application" a
      LEFT JOIN "StatusChange" sc ON sc."applicationId" = a.id
      WHERE a."userId" = ${userId} ${periodSql}
      GROUP BY a.position
    `,
    /*
     * "Time to first response" per application: the first StatusChange after
     * creation (fromStatus IS NOT NULL excludes the initial "entered
     * APPLIED" row an application is created with). An application still
     * sitting untouched at APPLIED has no row here yet — it has not been
     * responded to, so it is absent from the distribution rather than
     * counted as an instant response.
     */
    prisma.$queryRaw<ResponseBucketRow[]>`
      WITH first_response AS (
        SELECT
          a.id,
          GREATEST(0, EXTRACT(EPOCH FROM (MIN(sc."changedAt") - a."appliedDate")) / 86400.0) AS days
        FROM "Application" a
        JOIN "StatusChange" sc ON sc."applicationId" = a.id AND sc."fromStatus" IS NOT NULL
        WHERE a."userId" = ${userId} ${periodSql}
        GROUP BY a.id
      )
      SELECT
        CASE
          WHEN days <= 2 THEN '1-2'
          WHEN days <= 4 THEN '3-4'
          WHEN days <= 7 THEN '5-7'
          WHEN days <= 14 THEN '8-14'
          WHEN days <= 21 THEN '15-21'
          WHEN days <= 30 THEN '22-30'
          ELSE '30+'
        END AS bucket,
        COUNT(*)::int AS count
      FROM first_response
      GROUP BY bucket
    `,
    prisma.$queryRaw<{ median: number | null }[]>`
      WITH first_response AS (
        SELECT
          a.id,
          GREATEST(0, EXTRACT(EPOCH FROM (MIN(sc."changedAt") - a."appliedDate")) / 86400.0) AS days
        FROM "Application" a
        JOIN "StatusChange" sc ON sc."applicationId" = a.id AND sc."fromStatus" IS NOT NULL
        WHERE a."userId" = ${userId} ${periodSql}
        GROUP BY a.id
      )
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days)::float8 AS median FROM first_response
    `,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT a.id)::int AS count
      FROM "Application" a
      JOIN "StatusChange" sc ON sc."applicationId" = a.id
      WHERE a."userId" = ${userId} AND sc."toStatus"::text IN ${REACHED_INTERVIEW_STATUSES} ${periodSql}
    `,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT a.id)::int AS count
      FROM "Application" a
      JOIN "StatusChange" sc ON sc."applicationId" = a.id
      WHERE a."userId" = ${userId} AND sc."toStatus" = 'OFFER' ${periodSql}
    `,
    // Still active (not rejected/withdrawn/accepted), untouched since before the quiet threshold.
    prisma.application.count({
      where: {
        userId,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'ACCEPTED'] },
        updatedAt: { lt: quietSince },
        ...periodWhere,
      },
    }),
    prisma.application.count({
      where: { userId, status: 'REJECTED', interviews: { none: {} }, ...periodWhere },
    }),
    prisma.application.count({
      where: { userId, status: 'REJECTED', interviews: { some: {} }, ...periodWhere },
    }),
    prisma.application.count({ where: { userId, status: 'WITHDRAWN', ...periodWhere } }),
  ]);

  const countByStatus = new Map(statusCounts.map((row) => [row.status, row._count._all]));
  const funnel = APPLICATION_STATUSES.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));

  const countByWorkFormat = new Map<string, number>();
  let workFormatUnspecified = 0;
  for (const row of workFormatCounts) {
    if (row.workFormat === null) {
      workFormatUnspecified = row._count._all;
    } else {
      countByWorkFormat.set(row.workFormat, row._count._all);
    }
  }
  const byWorkFormat = WORK_FORMATS.map((workFormat) => ({
    workFormat,
    count: countByWorkFormat.get(workFormat) ?? 0,
  }));

  const overTime = overTimeRows.map((row) => ({
    // The Monday each week starts on — the frontend turns this into "WK 34".
    period: row.period.toISOString().slice(0, 10),
    count: row.count,
  }));

  const transitionByPair = new Map(
    transitionRows
      .filter((row) => row.to_status !== null)
      .map((row) => [`${row.from_status}->${row.to_status}`, row]),
  );
  const stageTransitions = TRACKED_TRANSITIONS.map(([from, to]) => {
    const row = transitionByPair.get(`${from}->${to}`);
    return {
      from: from as (typeof APPLICATION_STATUSES)[number],
      to: to as (typeof APPLICATION_STATUSES)[number],
      medianDays: row?.median_days ?? null,
      sampleCount: row?.sample_count ?? 0,
    };
  });

  const toBreakdownEntries = (rows: BreakdownRow[]) =>
    rows
      .map((row) => ({
        sent: row.sent,
        interviewed: row.interviewed,
        conversionRate: row.sent === 0 ? 0 : row.interviewed / row.sent,
        key: row.key,
      }))
      .sort((a, b) => b.sent - a.sent);

  const bySource = toBreakdownEntries(sourceRows).map(({ key, ...rest }) => ({ source: key, ...rest }));
  const byRole = toBreakdownEntries(roleRows).map(({ key, ...rest }) => ({ role: key, ...rest }));

  const bucketCounts = new Map(responseBucketRows.map((row) => [row.bucket, row.count]));
  const responseTimeDistribution = RESPONSE_TIME_BUCKETS.map((bucket) => ({
    bucket,
    count: bucketCounts.get(bucket) ?? 0,
  }));

  const lost = {
    noResponse,
    rejectedBeforeInterview,
    rejectedAfterInterview,
    withdrawn: withdrawnCount,
  };

  const salaryStats = {
    min: salaryAgg._min.salary,
    max: salaryAgg._max.salary,
    avg: salaryAgg._avg.salary,
    count: salaryAgg._count.salary,
  };

  const totalApplications = funnel.reduce((sum, entry) => sum + entry.count, 0);

  const summary = {
    totalApplications,
    reachedInterview: reachedInterview[0]?.count ?? 0,
    medianDaysToFirstResponse: medianResponseRows[0]?.median ?? null,
    offers: offersEver[0]?.count ?? 0,
  };

  const seasonSummary = buildSeasonSummary({ totalApplications, bySource, stageTransitions });

  return {
    funnel,
    overTime,
    stageTransitions,
    byWorkFormat,
    workFormatUnspecified,
    bySource,
    sourceUnspecified,
    byRole,
    responseTimeDistribution,
    lost,
    seasonSummary,
    salaryStats,
    summary,
  };
}

/**
 * Two or three plain-language takeaways, built only from numbers already
 * computed above — never a canned line, and never shown at all below five
 * applications, where a conversion percentage is more noise than signal
 * (see the design brief's edge case for this section).
 */
function buildSeasonSummary({
  totalApplications,
  bySource,
  stageTransitions,
}: {
  totalApplications: number;
  bySource: AnalyticsResponse['bySource'];
  stageTransitions: AnalyticsResponse['stageTransitions'];
}): string[] {
  if (totalApplications < 5) return [];

  const insights: string[] = [];

  const bestSource = bySource
    .filter((entry) => entry.sent >= 2)
    .reduce<AnalyticsResponse['bySource'][number] | null>(
      (best, entry) => (!best || entry.conversionRate > best.conversionRate ? entry : best),
      null,
    );
  if (bestSource && bestSource.conversionRate > 0) {
    const others = bySource.filter((entry) => entry.source !== bestSource.source && entry.sent >= 2);
    const othersAvg = others.length
      ? others.reduce((sum, entry) => sum + entry.conversionRate, 0) / others.length
      : 0;
    if (othersAvg > 0 && bestSource.conversionRate / othersAvg >= 1.3) {
      const multiple = Math.round((bestSource.conversionRate / othersAvg) * 10) / 10;
      insights.push(
        `${bestSource.source} is the most reliable channel: ${Math.round(bestSource.conversionRate * 100)}% reach an interview, about ${multiple}x the rest.`,
      );
    }
  }

  const withData = stageTransitions.filter((entry) => entry.medianDays !== null);
  if (withData.length > 0) {
    const slowest = withData.reduce((a, b) => ((b.medianDays ?? 0) > (a.medianDays ?? 0) ? b : a));
    insights.push(
      `The slowest step is ${formatStatusPair(slowest.from)} → ${formatStatusPair(slowest.to)}, at a median of ${Math.round((slowest.medianDays ?? 0) * 10) / 10} days.`,
    );
  }

  return insights.slice(0, 3);
}

function formatStatusPair(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
