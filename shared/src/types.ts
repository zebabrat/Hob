/**
 * Types shared between frontend and backend — the API contract, i.e. everything
 * that crosses the network boundary.
 */

/** GET /api/health */
export interface HealthResponse {
  status: string;
}

/** A user as returned by the API. The password hash never leaves the backend. */
export interface UserDto {
  id: number;
  email: string;
  name: string | null;
}

/** Body of POST /api/users */
export interface CreateUserInput {
  email: string;
  password: string;
  name?: string | null;
}

/** Body of PUT /api/users/:id — at least one field is required. */
export interface UpdateUserInput {
  email?: string;
  name?: string | null;
}

/** Body of POST /api/auth/sign-up */
export interface SignUpInput {
  email: string;
  password: string;
  name?: string | null;
}

/** Body of POST /api/auth/sign-in */
export interface SignInInput {
  email: string;
  password: string;
}

/** Minimum password length accepted by the API; shared so the UI can say it upfront. */
export const PASSWORD_MIN_LENGTH = 8;

/** Error payload; matches the shape Fastify produces by default. */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}
