import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Prisma } from '../generated/prisma/client.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

const { buildApp } = await import('../app.js');

const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };
const SESSION = { session: 'a'.repeat(64) };

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('failed', {
    code,
    clientVersion: '7.9.1',
  });
}

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = buildApp();
  await app.ready();
  // A live session for every request that carries the cookie.
  prismaMock.session.findUnique.mockResolvedValue({
    id: 1,
    expiresAt: new Date(Date.now() + 60_000),
    user: ALICE,
  });
});

describe('session guard', () => {
  it('401s every route without a cookie', async () => {
    const routes = [
      { method: 'GET' as const, url: '/api/users' },
      { method: 'GET' as const, url: '/api/users/1' },
      { method: 'POST' as const, url: '/api/users' },
      { method: 'PUT' as const, url: '/api/users/1' },
      { method: 'DELETE' as const, url: '/api/users/1' },
    ];

    for (const route of routes) {
      const response = await app.inject(route);
      expect(response.statusCode, `${route.method} ${route.url}`).toBe(401);
    }

    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});

describe('GET /api/users', () => {
  it('never selects the password column', async () => {
    prismaMock.user.findMany.mockResolvedValue([ALICE]);

    const response = await app.inject({ method: 'GET', url: '/api/users', cookies: SESSION });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([ALICE]);
    expect(prismaMock.user.findMany.mock.calls[0]?.[0]?.select).toEqual({
      id: true,
      email: true,
      name: true,
    });
  });
});

describe('GET /api/users/:id', () => {
  it('404s for a missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/999',
      cookies: SESSION,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().message).toContain('999');
  });

  it('400s on a non-numeric id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/abc',
      cookies: SESSION,
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('PUT /api/users/:id', () => {
  it('applies a partial update', async () => {
    prismaMock.user.update.mockResolvedValue({ ...ALICE, name: 'Renamed' });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/1',
      cookies: SESSION,
      payload: { name: 'Renamed' },
    });

    expect(response.statusCode).toBe(200);
    expect(prismaMock.user.update.mock.calls[0]?.[0]?.data).toEqual({
      email: undefined,
      name: 'Renamed',
    });
  });

  it('400s on an empty body instead of silently changing nothing', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/1',
      cookies: SESSION,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('maps a missing record to 404 and a taken email to 409', async () => {
    prismaMock.user.update.mockRejectedValueOnce(prismaError('P2025'));
    const missing = await app.inject({
      method: 'PUT',
      url: '/api/users/999',
      cookies: SESSION,
      payload: { name: 'Nope' },
    });

    prismaMock.user.update.mockRejectedValueOnce(prismaError('P2002'));
    const taken = await app.inject({
      method: 'PUT',
      url: '/api/users/1',
      cookies: SESSION,
      payload: { email: 'taken@example.com' },
    });

    expect(missing.statusCode).toBe(404);
    expect(taken.statusCode).toBe(409);
    expect(taken.json().message).toContain('taken@example.com');
  });
});

describe('DELETE /api/users/:id', () => {
  it('answers 204 and 404 for an already deleted user', async () => {
    prismaMock.user.delete.mockResolvedValueOnce(ALICE);
    const deleted = await app.inject({
      method: 'DELETE',
      url: '/api/users/1',
      cookies: SESSION,
    });

    prismaMock.user.delete.mockRejectedValueOnce(prismaError('P2025'));
    const again = await app.inject({
      method: 'DELETE',
      url: '/api/users/1',
      cookies: SESSION,
    });

    expect(deleted.statusCode).toBe(204);
    expect(again.statusCode).toBe(404);
  });
});
