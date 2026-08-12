import type { FastifyInstance } from 'fastify';
import type { ErrorResponse } from '@hob/shared';
import { Prisma } from './generated/prisma/client.js';

const UNIQUE_CONSTRAINT_FAILED = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

function pick(value: unknown, key: string): unknown {
  return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
}

/**
 * Which columns a P2002 refers to.
 *
 * Two shapes in the wild: Prisma's own `meta.target`, and — what this project
 * actually gets, running on the pg driver adapter — the constraint reported by
 * the driver under `meta.driverAdapterError.cause.constraint`. The value can be
 * either the column list or the index name (`User_email_key`).
 */
function conflictingFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.['target'];
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];

  const constraint = pick(pick(pick(error.meta, 'driverAdapterError'), 'cause'), 'constraint');
  const fields = pick(constraint, 'fields');
  if (Array.isArray(fields)) return fields.map(String);

  const index = pick(constraint, 'index');
  if (typeof index === 'string') return [index];

  return [];
}

/** Matches both a plain column name and an index name like `User_email_key`. */
function mentionsEmail(fields: string[]): boolean {
  return fields.some((field) => field.toLowerCase().includes('email'));
}

function requestedId(params: unknown): string | null {
  if (params && typeof params === 'object' && 'id' in params) {
    return String((params as { id: unknown }).id);
  }
  return null;
}

function submittedEmail(body: unknown): string | null {
  if (body && typeof body === 'object' && 'email' in body) {
    const email = (body as { email: unknown }).email;
    return typeof email === 'string' ? email : null;
  }
  return null;
}

/**
 * Turns database failures into the HTTP answers they mean, in one place.
 *
 * Every route used to repeat the same try/catch around Prisma: a unique email
 * became 409, a missing row became 404. Doing it here means a route cannot
 * forget, and a raw Prisma error can no longer reach the client. Messages are
 * rebuilt from the request so they stay as specific as they were before.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === UNIQUE_CONSTRAINT_FAILED) {
        const email = mentionsEmail(conflictingFields(error))
          ? submittedEmail(request.body)
          : null;

        const response: ErrorResponse = {
          statusCode: 409,
          error: 'Conflict',
          message: email ? `Email ${email} is already taken` : 'That value is already taken',
        };

        return reply.code(409).send(response);
      }

      if (error.code === RECORD_NOT_FOUND) {
        const id = requestedId(request.params);

        const response: ErrorResponse = {
          statusCode: 404,
          error: 'Not Found',
          message: id ? `User with id ${id} not found` : 'Not found',
        };

        return reply.code(404).send(response);
      }

      // Any other database error is ours, not the caller's: log it and answer
      // 500 rather than leaking a query into the response.
      request.log.error({ err: error }, 'unhandled database error');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal Server Error',
      } satisfies ErrorResponse);
    }

    // Validation failures and everything else keep Fastify's own handling.
    return reply.send(error);
  });
}

/** For the one case a route knows about but the database does not: a missing row it queried itself. */
export function notFound(id: number): ErrorResponse {
  return {
    statusCode: 404,
    error: 'Not Found',
    message: `User with id ${id} not found`,
  };
}
