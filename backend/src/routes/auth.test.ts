import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Prisma } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';

// Routes talk to the database through this single module, so mocking it keeps
// the suite hermetic — no Postgres in CI, no test data in a real database.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { create: vi.fn(), findUnique: vi.fn() },
    session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

const { buildApp } = await import('../app.js');

const ORIGIN = 'https://hob-frontend-jet.vercel.app';
const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };
// Long enough and varied enough to clear scorePassword's minimum — sign-up
// now enforces that, so the happy-path tests need a password that survives
// it rather than merely PASSWORD_MIN_LENGTH.
const STRONG_PASSWORD = 'Sup3rSecret!42';

function uniqueEmailViolation() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.9.1',
    meta: { target: ['email'] },
  });
}

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = buildApp();
  await app.ready();
  prismaMock.session.create.mockResolvedValue({ id: 1 });
});

describe('POST /api/auth/sign-up', () => {
  it('creates the user and hands out a session cookie', async () => {
    prismaMock.user.create.mockResolvedValue(ALICE);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: STRONG_PASSWORD, name: 'Alice' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(ALICE);

    const cookie = response.cookies[0];
    expect(cookie).toMatchObject({
      name: 'session',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
    });
    expect(cookie?.value).toHaveLength(64);
  });

  it('never stores the password as given', async () => {
    prismaMock.user.create.mockResolvedValue(ALICE);

    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: STRONG_PASSWORD },
    });

    const stored = prismaMock.user.create.mock.calls[0]?.[0]?.data?.password;
    expect(stored).toBeTypeOf('string');
    expect(stored).not.toBe(STRONG_PASSWORD);
    expect(stored).toMatch(/^\$2[aby]\$/);
  });

  it('answers 409 when the email is taken', async () => {
    prismaMock.user.create.mockRejectedValue(uniqueEmailViolation());

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: STRONG_PASSWORD },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Email alice@example.com is already taken');
  });

  it('rejects a short password and an invalid email', async () => {
    const short = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: 'short' },
    });
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'not-an-email', password: STRONG_PASSWORD },
    });

    expect(short.statusCode).toBe(400);
    expect(invalid.statusCode).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects a password that is long enough but too weak', async () => {
    // 8+ characters, but a single repeated word — scorePassword puts this
    // well under the minimum even though PASSWORD_MIN_LENGTH alone would
    // let it through.
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: 'lowercase' },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects unknown fields in the body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'alice@example.com', password: STRONG_PASSWORD, role: 'admin' },
    });

    expect(response.statusCode).toBe(400);
    // The wording belongs to the validator; what matters is that the offending
    // field is named and the request did not go through.
    expect(response.json().message).toContain('role');
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/sign-in', () => {
  it('signs in with the right password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...ALICE,
      password: await hashPassword('supersecret'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'alice@example.com', password: 'supersecret' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(ALICE);
    expect(response.cookies[0]?.name).toBe('session');
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      ...ALICE,
      password: await hashPassword('supersecret'),
    });
    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'alice@example.com', password: 'wrongpassword' },
    });

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'nobody@example.com', password: 'supersecret' },
    });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    // Identical wording — the response must not reveal which account exists.
    expect(unknownEmail.json()).toEqual(wrongPassword.json());
    expect(wrongPassword.cookies).toHaveLength(0);
  });
});

describe('rate limiting', () => {
  it('stops password guessing after a handful of attempts', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const attempt = () =>
      app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        headers: { 'x-forwarded-for': '203.0.113.7' },
        payload: { email: 'alice@example.com', password: 'guess' },
      });

    const codes: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      codes.push((await attempt()).statusCode);
    }

    // The first attempts answer normally, then the limiter takes over.
    expect(codes.slice(0, 10)).toEqual(Array.from({ length: 10 }, () => 401));
    expect(codes.slice(10)).toEqual([429, 429]);
  });

  it('leaves the health check alone', async () => {
    for (let i = 0; i < 12; i += 1) {
      const response = await app.inject({ method: 'GET', url: '/api/health' });
      expect(response.statusCode).toBe(200);
    }
  });
});

describe('GET /api/auth/me', () => {
  it('401s without a cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' });

    expect(response.statusCode).toBe(401);
  });

  it('returns the user behind a live session', async () => {
    prismaMock.session.findUnique.mockResolvedValue({
      id: 1,
      expiresAt: new Date(Date.now() + 60_000),
      user: ALICE,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { session: 'a'.repeat(64) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(ALICE);
  });

  it('rejects an expired session and drops it', async () => {
    prismaMock.session.findUnique.mockResolvedValue({
      id: 7,
      expiresAt: new Date(Date.now() - 60_000),
      user: ALICE,
    });
    prismaMock.session.delete.mockResolvedValue({ id: 7 });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { session: 'a'.repeat(64) },
    });

    expect(response.statusCode).toBe(401);
    expect(prismaMock.session.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});

describe('POST /api/auth/sign-out', () => {
  it('deletes the session and clears the cookie', async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      cookies: { session: 'a'.repeat(64) },
    });

    expect(response.statusCode).toBe(204);
    // Looked up by hash — the raw cookie value is never stored, so it cannot
    // appear in the query either.
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: createHash('sha256').update('a'.repeat(64)).digest('hex') },
    });
    // Cleared with the same attributes it was set with, or the browser keeps it.
    expect(response.cookies[0]).toMatchObject({
      name: 'session',
      value: '',
      sameSite: 'None',
      secure: true,
    });
  });

  it('succeeds without a session instead of failing', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/sign-out' });

    expect(response.statusCode).toBe(204);
  });
});

describe('CORS', () => {
  it('answers the preflight for an allowed origin', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/sign-in',
      headers: { origin: ORIGIN, 'access-control-request-method': 'POST' },
    });

    expect(response.headers['access-control-allow-origin']).toBe(ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    // PUT and DELETE must be listed, or the users routes fail cross-origin.
    expect(response.headers['access-control-allow-methods']).toContain('DELETE');
  });

  it('does not vouch for an unknown origin', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/sign-in',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'POST',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
