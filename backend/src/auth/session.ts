import { randomBytes } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import type { UserDto } from '@hob/shared';
import { prisma } from '../db.js';

export const SESSION_COOKIE = 'session';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Public user fields — keeps the password hash out of every query result. */
export const userSelect = { id: true, email: true, name: true } as const;

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');

  await prisma.session.create({
    data: { token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });

  return token;
}

export async function findSessionUser(token: string): Promise<UserDto | null> {
  const session = await prisma.session.findUnique({
    where: { token },
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
  await prisma.session.deleteMany({ where: { token } });
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}
