import { z } from 'zod';
import { isPasswordStrongEnough } from './passwordStrength.js';

/**
 * The API contract — everything that crosses the network boundary.
 *
 * Schemas are the source, types are derived from them. Written separately they
 * drift silently: the backend keeps validating the old shape while TypeScript
 * on both sides insists the new one is fine.
 */

/** Minimum password length accepted by the API; shared so the UI can say it upfront. */
export const PASSWORD_MIN_LENGTH = 8;

const email = z.email().min(3).max(254);
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(128)
  // The client shows the same criteria live as a meter — this is the one
  // place that requirement is actually enforced, since a client-side check
  // alone is a suggestion, not a rule. Requires all five: 8+ characters,
  // lowercase, uppercase, a digit, and a symbol.
  .refine((value) => isPasswordStrongEnough(value), {
    message: 'Password must have 8+ characters with upper, lower, a number, and a symbol',
  });
const name = z.string().max(200).nullish();

/** GET /api/health */
export const healthResponseSchema = z.object({
  status: z.string(),
});

/** A user as returned by the API. The password hash never leaves the backend. */
export const userDtoSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  name: z.string().nullable(),
});

/** Body of POST /api/auth/sign-up */
export const signUpInputSchema = z
  .object({
    email,
    password,
    name,
  })
  .strict();

/** Body of POST /api/auth/sign-in */
export const signInInputSchema = z
  .object({
    email,
    // No minimum here: old passwords stay valid even if the rule tightens later.
    password: z.string().max(128),
  })
  .strict();

/** Error payload; matches the shape Fastify produces by default. */
export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
});

/* ------------------------------------------------------------------ *
 * Job application tracker
 * ------------------------------------------------------------------ */

/**
 * The enum values, mirrored from the Prisma schema. Prisma generates its own
 * copy on the backend and cannot be imported here, so the two are kept in step
 * by hand — changing one without the other fails the build on the route that
 * maps between them.
 */
export const APPLICATION_STATUSES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export const WORK_FORMATS = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

export const SALARY_TYPES = ['GROSS', 'NET'] as const;

export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

/**
 * How many days an active (not rejected/withdrawn) application can sit
 * untouched before the UI calls it "quiet" — the board dims the card and
 * counts it under analytics' "no response" bucket. One constant so the two
 * screens can never disagree on the threshold.
 */
export const QUIET_AFTER_DAYS = 14;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const workFormatSchema = z.enum(WORK_FORMATS);
export const salaryTypeSchema = z.enum(SALARY_TYPES);
export const prioritySchema = z.enum(PRIORITY_LEVELS);

/** Path params for every /:id route in the tracker. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * The writable fields of an application, in one place: POST takes them as they
 * are, PATCH takes the same set made optional. Written twice they drift, and a
 * field would end up creatable but not editable.
 */
/**
 * A date input's native validation guarantees a well-formed YYYY-MM-DD
 * string, but not a *sane* one — nothing stops a mistyped year like 22026
 * from reaching here. `new Date()` happily parses that into a real, valid
 * Date object (JS represents years up to ~275760), so it clears every check
 * an ordinary "is this a valid date" would run. It only breaks later, at
 * read time: `pg`/Prisma's own date decoder returns Invalid Date for a
 * timestamp that far out, and every route serving the row 500s from then on
 * (found by hand while testing the offer-deadline field). Bounding every
 * application date to a plausible range up front is what keeps a fat-fingered
 * year from ever reaching the database.
 */
const reasonableDate = z.coerce
  .date()
  .min(new Date('1970-01-01T00:00:00.000Z'))
  .max(new Date('2100-01-01T00:00:00.000Z'));

const applicationFields = {
  company: z.string().trim().min(1).max(200),
  position: z.string().trim().min(1).max(200),
  // Who you actually talked to there — see the Prisma schema comment.
  recruiter: z.string().trim().max(200).nullish(),
  // Omitted on create, where the database default (APPLIED) applies.
  status: applicationStatusSchema,
  // Omitted on create, where the database default (MEDIUM) applies.
  priority: prioritySchema,
  // Whole currency units. nullish so a field can be cleared, not only set.
  salary: z.number().int().nonnegative().max(100_000_000).nullish(),
  // Whether `salary` is quoted before or after tax — meaningless without a
  // number attached, but nothing here enforces that pairing; a salaryType
  // with no salary is simply never read anywhere.
  salaryType: salaryTypeSchema.nullish(),
  workFormat: workFormatSchema.nullish(),
  jobUrl: z.url().max(2000).nullish(),
  // Freeform channels ("Referral", "LinkedIn") — see the Prisma schema
  // comment. A list, not one string: an application can have arrived through
  // more than one channel. `.optional()` rather than `.nullish()` like the
  // rest of this object, matching `labels` below — an array already has an
  // empty-list way to say "none", so a separate null is not needed.
  source: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  // Only meaningful at OFFER; nothing stops it being set earlier, but nothing
  // reads it before then either.
  offerDeadline: reasonableDate.nullish(),
  labels: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  summary: z.string().max(2000).nullish(),
  notes: z.string().max(5000).nullish(),
  appliedDate: reasonableDate,
};

/** Body of POST /api/applications */
export const applicationCreateInputSchema = z
  .object({
    ...applicationFields,
    status: applicationFields.status.optional(),
    priority: applicationFields.priority.optional(),
  })
  .strict();

/** Body of PATCH /api/applications/:id */
export const applicationUpdateInputSchema = z
  .object(applicationFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

const interviewFields = {
  round: z.string().trim().min(1).max(100),
  // Bounded for the same reason as reasonableDate above — a stray extra
  // digit in the year must not reach the database.
  scheduledAt: reasonableDate.nullish(),
  notes: z.string().max(5000).nullish(),
};

/** Body of POST /api/applications/:id/interviews */
export const interviewCreateInputSchema = z.object(interviewFields).strict();

/** Body of PATCH /api/interviews/:id */
export const interviewUpdateInputSchema = z
  .object(interviewFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

/**
 * Query of POST /api/applications/:id/attachments. The file itself is the
 * request body, so its name travels alongside it.
 */
export const attachmentUploadQuerySchema = z.object({
  fileName: z.string().trim().min(1).max(255),
});

/* --- Responses. Timestamps cross the wire as ISO strings ---------------- */

export const interviewDtoSchema = z.object({
  id: z.number().int(),
  applicationId: z.number().int(),
  round: z.string(),
  scheduledAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

/** One row per status transition — the detail page's status timeline reads real per-stage dates from this, not a guess. */
export const statusChangeDtoSchema = z.object({
  id: z.number().int(),
  applicationId: z.number().int(),
  fromStatus: applicationStatusSchema.nullable(),
  toStatus: applicationStatusSchema,
  changedAt: z.string(),
});

export const attachmentDtoSchema = z.object({
  id: z.number().int(),
  applicationId: z.number().int(),
  blobUrl: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(),
});

export const applicationDtoSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  company: z.string(),
  position: z.string(),
  recruiter: z.string().nullable(),
  status: applicationStatusSchema,
  priority: prioritySchema,
  salary: z.number().int().nullable(),
  salaryType: salaryTypeSchema.nullable(),
  workFormat: workFormatSchema.nullable(),
  jobUrl: z.string().nullable(),
  source: z.array(z.string()),
  offerDeadline: z.string().nullable(),
  labels: z.array(z.string()),
  summary: z.string().nullable(),
  notes: z.string().nullable(),
  appliedDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  interviews: z.array(interviewDtoSchema),
  attachments: z.array(attachmentDtoSchema),
  /** Oldest first — see StatusChange in the Prisma schema. */
  statusChanges: z.array(statusChangeDtoSchema),
});

/** Response of GET /api/applications */
export const applicationListSchema = z.array(applicationDtoSchema);

/* --- Response of GET /api/applications/analytics ------------------------ */

/** How many applications currently sit at each status — one entry per enum value, zero included. */
export const funnelEntrySchema = z.object({
  status: applicationStatusSchema,
  count: z.number().int(),
});

/** Applications filed per ISO week, oldest first. "period" is the Monday that week starts on, as "YYYY-MM-DD". */
export const overTimeEntrySchema = z.object({
  period: z.string(),
  count: z.number().int(),
});

/**
 * The median time a stay at `from` took when it led to `to` — one row per
 * real forward transition this status model can report on (see
 * TRACKED_TRANSITIONS in analytics.ts). Null when that exact transition has
 * never happened yet — there is no median of zero data points.
 */
export const stageTransitionEntrySchema = z.object({
  from: applicationStatusSchema,
  to: applicationStatusSchema,
  medianDays: z.number().nullable(),
  /** How many transitions this median is built from — a single-digit count is worth reading differently than a hundred. */
  sampleCount: z.number().int(),
});

/** One entry per known work format, zero included; applications with none set are counted separately. */
export const workFormatEntrySchema = z.object({
  workFormat: workFormatSchema,
  count: z.number().int(),
});

/**
 * One row per distinct `source` value the user has actually typed in — an
 * open vocabulary, not a fixed enum, so this is built from whatever strings
 * exist rather than a hardcoded list. "Interviewed" counts an application
 * that has reached INTERVIEW or further — the same signal `summary.
 * reachedInterview` uses, so the two numbers can never disagree about what
 * "interviewed" means.
 */
export const sourceBreakdownEntrySchema = z.object({
  source: z.string(),
  sent: z.number().int(),
  interviewed: z.number().int(),
  /** interviewed / sent, 0 when sent is 0. */
  conversionRate: z.number(),
});

/** Same shape and semantics as sourceBreakdownEntrySchema, grouped by `position` (the job title/role typed on the application) instead of `source`. */
export const roleBreakdownEntrySchema = z.object({
  role: z.string(),
  sent: z.number().int(),
  interviewed: z.number().int(),
  conversionRate: z.number(),
});

/** One entry per bucket, in a fixed order — days from appliedDate to the first StatusChange after creation. Applications never yet responded to are excluded, not counted as an instant response. */
export const responseTimeBucketSchema = z.object({
  bucket: z.enum(['1-2', '3-4', '5-7', '8-14', '15-21', '22-30', '30+']),
  count: z.number().int(),
});

/**
 * Where applications stop moving, built entirely from status and whether an
 * interview was ever recorded — no field this app doesn't have. "Before
 * interview" / "after interview" is the rejected split the mockup calls
 * "после скрининга" / "после финала"; this model has no separate screening
 * vs. final distinction, so whether an interview round exists is the closest
 * honest proxy.
 */
export const lostBreakdownSchema = z.object({
  /** Still active (not rejected/withdrawn/accepted), untouched for 14+ days. */
  noResponse: z.number().int(),
  rejectedBeforeInterview: z.number().int(),
  rejectedAfterInterview: z.number().int(),
  withdrawn: z.number().int(),
});

/** Null fields mean no application has salary filled in yet. */
export const salaryStatsSchema = z.object({
  min: z.number().int().nullable(),
  max: z.number().int().nullable(),
  avg: z.number().nullable(),
  count: z.number().int(),
});

export const analyticsSummarySchema = z.object({
  totalApplications: z.number().int(),
  /** Reached INTERVIEW or further, ever — not a current-status snapshot. */
  reachedInterview: z.number().int(),
  /** Median days from appliedDate to the first status change after creation. Null with no responses yet. */
  medianDaysToFirstResponse: z.number().nullable(),
  /** Reached OFFER at some point in the period — not "currently at OFFER", since one may since have moved to ACCEPTED. */
  offers: z.number().int(),
});

/** `30d` re-scopes every section to applications with appliedDate in the last 30 days; `all` is the whole history. */
export const analyticsPeriodSchema = z.enum(['30d', 'all']);

export const analyticsQuerySchema = z.object({
  period: analyticsPeriodSchema.optional().default('all'),
});

export const analyticsResponseSchema = z.object({
  funnel: z.array(funnelEntrySchema),
  overTime: z.array(overTimeEntrySchema),
  stageTransitions: z.array(stageTransitionEntrySchema),
  byWorkFormat: z.array(workFormatEntrySchema),
  /** Applications with no workFormat set — kept out of byWorkFormat so that array stays one entry per real format. */
  workFormatUnspecified: z.number().int(),
  bySource: z.array(sourceBreakdownEntrySchema),
  /** Applications with an empty source list — kept out of bySource for the same reason as workFormatUnspecified. An application with two sources is counted once here or twice in bySource, never both. */
  sourceUnspecified: z.number().int(),
  byRole: z.array(roleBreakdownEntrySchema),
  responseTimeDistribution: z.array(responseTimeBucketSchema),
  lost: lostBreakdownSchema,
  /** 0–3 plain-language takeaways computed from the numbers above; empty below 5 applications, where a % is noise more than signal. */
  seasonSummary: z.array(z.string()),
  salaryStats: salaryStatsSchema,
  summary: analyticsSummarySchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type WorkFormat = z.infer<typeof workFormatSchema>;
export type SalaryType = z.infer<typeof salaryTypeSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateInputSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateInputSchema>;
export type InterviewCreateInput = z.infer<typeof interviewCreateInputSchema>;
export type InterviewUpdateInput = z.infer<typeof interviewUpdateInputSchema>;
export type AttachmentUploadQuery = z.infer<typeof attachmentUploadQuerySchema>;
export type InterviewDto = z.infer<typeof interviewDtoSchema>;
export type AttachmentDto = z.infer<typeof attachmentDtoSchema>;
export type StatusChangeDto = z.infer<typeof statusChangeDtoSchema>;
export type ApplicationDto = z.infer<typeof applicationDtoSchema>;

export type FunnelEntry = z.infer<typeof funnelEntrySchema>;
export type OverTimeEntry = z.infer<typeof overTimeEntrySchema>;
export type StageTransitionEntry = z.infer<typeof stageTransitionEntrySchema>;
export type WorkFormatEntry = z.infer<typeof workFormatEntrySchema>;
export type SourceBreakdownEntry = z.infer<typeof sourceBreakdownEntrySchema>;
export type RoleBreakdownEntry = z.infer<typeof roleBreakdownEntrySchema>;
export type ResponseTimeBucket = z.infer<typeof responseTimeBucketSchema>;
export type LostBreakdown = z.infer<typeof lostBreakdownSchema>;
export type SalaryStats = z.infer<typeof salaryStatsSchema>;
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
