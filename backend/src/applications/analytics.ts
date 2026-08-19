import { APPLICATION_STATUSES, WORK_FORMATS } from '@hob/shared';
import type { AnalyticsResponse } from '@hob/shared';
import { prisma } from '../db.js';

/**
 * Applications filed per calendar month. Postgres does the bucketing
 * (date_trunc), not JS — Prisma's groupBy has no way to truncate a date, so
 * this is the one place in the module that reaches for raw SQL rather than
 * the query builder. count is cast to ::int in the query itself: Postgres'
 * COUNT(*) is a bigint, which is not something JSON.stringify can serialise.
 */
interface OverTimeRow {
  period: Date;
  count: number;
}

/**
 * One row per status that has ever been entered, built from StatusChange with
 * a window function (LEAD) to find each stay's end — another shape Prisma's
 * query builder cannot express, hence raw SQL again.
 */
interface StageDurationRow {
  status: string;
  avgDays: number | null;
  sampleCount: number;
}

export async function loadAnalytics(userId: number): Promise<AnalyticsResponse> {
  const [statusCounts, workFormatCounts, salaryAgg, overTimeRows, stageRows] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ['workFormat'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.application.aggregate({
      where: { userId, salary: { not: null } },
      _min: { salary: true },
      _max: { salary: true },
      _avg: { salary: true },
      _count: { salary: true },
    }),
    prisma.$queryRaw<OverTimeRow[]>`
      SELECT date_trunc('month', "appliedDate") AS period, COUNT(*)::int AS count
      FROM "Application"
      WHERE "userId" = ${userId}
      GROUP BY period
      ORDER BY period ASC
    `,
    /*
     * For every StatusChange row, "left_at" is the changedAt of the next row
     * for the same application (any status — any transition ends the stay),
     * or now() when there is none, meaning the application is still there.
     * Averaging (left_at - entered_at) per toStatus is "time per stage".
     */
    prisma.$queryRaw<StageDurationRow[]>`
      WITH stays AS (
        SELECT
          sc."toStatus"::text AS status,
          sc."changedAt" AS entered_at,
          COALESCE(
            LEAD(sc."changedAt") OVER (PARTITION BY sc."applicationId" ORDER BY sc."changedAt"),
            now()
          ) AS left_at
        FROM "StatusChange" sc
        JOIN "Application" a ON a.id = sc."applicationId"
        WHERE a."userId" = ${userId}
      )
      SELECT
        status,
        AVG(EXTRACT(EPOCH FROM (left_at - entered_at)) / 86400.0)::float8 AS "avgDays",
        COUNT(*)::int AS "sampleCount"
      FROM stays
      GROUP BY status
    `,
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
    // "YYYY-MM" — date_trunc always lands on the 1st, so the day carries no
    // information; the response names the month, not a specific date.
    period: row.period.toISOString().slice(0, 7),
    count: row.count,
  }));

  const stageByStatus = new Map(stageRows.map((row) => [row.status, row]));
  const avgTimePerStage = APPLICATION_STATUSES.map((status) => {
    const row = stageByStatus.get(status);
    return {
      status,
      avgDays: row?.avgDays ?? null,
      sampleCount: row?.sampleCount ?? 0,
    };
  });

  const salaryStats = {
    min: salaryAgg._min.salary,
    max: salaryAgg._max.salary,
    avg: salaryAgg._avg.salary,
    count: salaryAgg._count.salary,
  };

  const totalApplications = funnel.reduce((sum, entry) => sum + entry.count, 0);
  const rejected = countByStatus.get('REJECTED') ?? 0;
  const withdrawn = countByStatus.get('WITHDRAWN') ?? 0;
  const offers = countByStatus.get('OFFER') ?? 0;

  const summary = {
    totalApplications,
    activeApplications: totalApplications - rejected - withdrawn,
    offers,
    rejectionRate: totalApplications === 0 ? 0 : rejected / totalApplications,
  };

  return {
    funnel,
    overTime,
    avgTimePerStage,
    byWorkFormat,
    workFormatUnspecified,
    salaryStats,
    summary,
  };
}
