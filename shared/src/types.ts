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

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
