import { z } from 'zod';

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
const password = z.string().min(PASSWORD_MIN_LENGTH).max(128);
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
  'REJECTED',
  'WITHDRAWN',
] as const;

export const WORK_FORMATS = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const workFormatSchema = z.enum(WORK_FORMATS);

/** Path params for every /:id route in the tracker. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * The writable fields of an application, in one place: POST takes them as they
 * are, PATCH takes the same set made optional. Written twice they drift, and a
 * field would end up creatable but not editable.
 */
const applicationFields = {
  company: z.string().trim().min(1).max(200),
  position: z.string().trim().min(1).max(200),
  // Omitted on create, where the database default (APPLIED) applies.
  status: applicationStatusSchema,
  // Whole currency units. nullish so a field can be cleared, not only set.
  salary: z.number().int().nonnegative().max(100_000_000).nullish(),
  workFormat: workFormatSchema.nullish(),
  jobUrl: z.url().max(2000).nullish(),
  summary: z.string().max(2000).nullish(),
  notes: z.string().max(5000).nullish(),
  appliedDate: z.coerce.date(),
};

/** Body of POST /api/applications */
export const applicationCreateInputSchema = z
  .object({
    ...applicationFields,
    status: applicationFields.status.optional(),
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
  scheduledAt: z.coerce.date().nullish(),
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
  status: applicationStatusSchema,
  salary: z.number().int().nullable(),
  workFormat: workFormatSchema.nullable(),
  jobUrl: z.string().nullable(),
  summary: z.string().nullable(),
  notes: z.string().nullable(),
  appliedDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  interviews: z.array(interviewDtoSchema),
  attachments: z.array(attachmentDtoSchema),
});

/** Response of GET /api/applications */
export const applicationListSchema = z.array(applicationDtoSchema);

/* --- Response of GET /api/applications/analytics ------------------------ */

/** How many applications currently sit at each status — one entry per enum value, zero included. */
export const funnelEntrySchema = z.object({
  status: applicationStatusSchema,
  count: z.number().int(),
});

/** Applications filed per calendar month, oldest first. "period" is "YYYY-MM". */
export const overTimeEntrySchema = z.object({
  period: z.string(),
  count: z.number().int(),
});

/**
 * How long applications typically stay at a status before moving on (or
 * "now" if they have not). Null when nothing has ever reached that status —
 * there is no average of zero data points.
 */
export const stageDurationEntrySchema = z.object({
  status: applicationStatusSchema,
  avgDays: z.number().nullable(),
  /** How many stays this average is built from — a single-digit count is worth reading differently than a hundred. */
  sampleCount: z.number().int(),
});

/** One entry per known work format, zero included; applications with none set are counted separately. */
export const workFormatEntrySchema = z.object({
  workFormat: workFormatSchema,
  count: z.number().int(),
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
  /** Not REJECTED and not WITHDRAWN. */
  activeApplications: z.number().int(),
  /** Currently at OFFER — a snapshot, like the rest of this summary, not "ever offered". */
  offers: z.number().int(),
  /** rejected / total, as a fraction from 0 to 1; 0 when there are no applications at all. */
  rejectionRate: z.number(),
});

export const analyticsResponseSchema = z.object({
  funnel: z.array(funnelEntrySchema),
  overTime: z.array(overTimeEntrySchema),
  avgTimePerStage: z.array(stageDurationEntrySchema),
  byWorkFormat: z.array(workFormatEntrySchema),
  /** Applications with no workFormat set — kept out of byWorkFormat so that array stays one entry per real format. */
  workFormatUnspecified: z.number().int(),
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
export type IdParam = z.infer<typeof idParamSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateInputSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateInputSchema>;
export type InterviewCreateInput = z.infer<typeof interviewCreateInputSchema>;
export type InterviewUpdateInput = z.infer<typeof interviewUpdateInputSchema>;
export type AttachmentUploadQuery = z.infer<typeof attachmentUploadQuerySchema>;
export type InterviewDto = z.infer<typeof interviewDtoSchema>;
export type AttachmentDto = z.infer<typeof attachmentDtoSchema>;
export type ApplicationDto = z.infer<typeof applicationDtoSchema>;

export type FunnelEntry = z.infer<typeof funnelEntrySchema>;
export type OverTimeEntry = z.infer<typeof overTimeEntrySchema>;
export type StageDurationEntry = z.infer<typeof stageDurationEntrySchema>;
export type WorkFormatEntry = z.infer<typeof workFormatEntrySchema>;
export type SalaryStats = z.infer<typeof salaryStatsSchema>;
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
