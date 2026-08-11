import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ErrorResponse, UserDto } from '@hob/shared';
import { SESSION_COOKIE, clearSessionCookie, findSessionUser } from '../auth/session.js';

const unauthorized: ErrorResponse = {
  statusCode: 401,
  error: 'Unauthorized',
  message: 'Authentication required',
};

/** preHandler for protected routes: resolves the session cookie into request.currentUser. */
export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies[SESSION_COOKIE];
  const user = token ? await findSessionUser(token) : null;

  if (!user) {
    // Drop the cookie as well — it is either forged or points at a dead session.
    clearSessionCookie(reply);
    return reply.code(401).send(unauthorized);
  }

  request.currentUser = user;
}

/**
 * Reads the user that requireSession put on the request. Throws instead of returning
 * undefined, so a route that forgets the preHandler fails loudly rather than leaking data.
 */
export function currentUser(request: FastifyRequest): UserDto {
  if (!request.currentUser) {
    throw new Error('currentUser is not set — requireSession must run before this handler');
  }
  return request.currentUser;
}
