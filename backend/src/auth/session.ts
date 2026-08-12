import { createHash, randomBytes } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import type { UserDto } from '@hob/shared';
import { prisma } from '../db.js';

export const SESSION_COOKIE = 'session';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Public user fields — keeps the password hash out of every query result. */
export const userSelect = { id: true, email: true, name: true } as const;

/**
 * The frontend is served from a different domain than the API, so the session
 * cookie has to be cross-site: SameSite=None, which browsers only accept
 * together with Secure — hence HTTPS on both sides (localhost counts as secure).
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  path: '/',
} as const;

/**
 * SHA-256 rather than bcrypt: the token is 32 random bytes, so there is nothing
 * to brute force and lookups stay a single indexed query. The point is only
 * that a leaked database row cannot be replayed as a cookie.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Returns the raw token for the cookie; only its hash reaches the database. */
export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  // Housekeeping, not part of the answer: a failure here must not fail a sign-in.
  await deleteExpiredSessions().catch(() => undefined);

  return token;
}

export async function findSessionUser(token: string): Promise<UserDto | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: userSelect } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Expired sessions are dropped on sight so the table does not grow forever.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function deleteSession(token: string): Promise<void> {
  // deleteMany does not throw when the token is already gone.
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/**
 * Clears sessions nobody will ever present again. Called when a new one is
 * created: sign-ins are rare enough for this to stay cheap, and it keeps the
 * table from growing without a scheduled job — which a serverless deployment
 * has no obvious place for.
 */
export async function deleteExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });

  return count;
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  // Attributes must match the ones the cookie was set with, or the browser
  // keeps the original cookie alongside the expired one.
  reply.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
}
