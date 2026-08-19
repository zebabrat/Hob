import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    session: { findUnique: vi.fn(), delete: vi.fn() },
    interview: { updateMany: vi.fn(), deleteMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

const { buildApp } = await import('../app.js');

const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };
const COOKIES = { session: 'a'.repeat(64) };

const ROUND = {
  id: 3,
  applicationId: 10,
  round: 'Technical',
  scheduledAt: new Date('2026-08-20T10:00:00.000Z'),
  notes: null,
  createdAt: new Date('2026-08-02T09:00:00.000Z'),
};

/**
 * A round carries no userId of its own, so ownership is reached one level up
 * through the application it belongs to. This is the filter every route here
 * has to send; without the nested part, any id would match.
 */
const OWNED_BY_ALICE = { application: { userId: ALICE.id } };

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = buildApp();
  await app.ready();

  prismaMock.session.findUnique.mockResolvedValue({
    id: 1,
    expiresAt: new Date(Date.now() + 60_000),
    user: ALICE,
  });
});

describe('PATCH /api/interviews/:id', () => {
  it('updates a round on your own application', async () => {
    prismaMock.interview.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.interview.findUniqueOrThrow.mockResolvedValue({
      ...ROUND,
      notes: 'went well',
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      cookies: COOKIES,
      payload: { notes: 'went well' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().notes).toBe('went well');
    expect(prismaMock.interview.updateMany.mock.calls[0]?.[0]?.where).toEqual({
      id: 3,
      ...OWNED_BY_ALICE,
    });
  });

  it('sends only the named fields', async () => {
    prismaMock.interview.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.interview.findUniqueOrThrow.mockResolvedValue(ROUND);

    await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      cookies: COOKIES,
      payload: { round: 'Final' },
    });

    expect(prismaMock.interview.updateMany.mock.calls[0]?.[0]?.data).toEqual({
      round: 'Final',
    });
  });

  it('clears the schedule when given null', async () => {
    prismaMock.interview.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.interview.findUniqueOrThrow.mockResolvedValue({
      ...ROUND,
      scheduledAt: null,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      cookies: COOKIES,
      payload: { scheduledAt: null },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().scheduledAt).toBeNull();
  });

  it('404s for a round on somebody else application', async () => {
    // Nothing matched the id together with the ownership filter.
    prismaMock.interview.updateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/999',
      cookies: COOKIES,
      payload: { notes: 'mine now' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('Interview not found');
    expect(prismaMock.interview.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('rejects an empty body and an unknown field', async () => {
    const empty = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      cookies: COOKIES,
      payload: {},
    });
    const unknown = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      cookies: COOKIES,
      payload: { rounds: 'Final' },
    });

    expect(empty.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(400);
    expect(prismaMock.interview.updateMany).not.toHaveBeenCalled();
  });

  it('401s without a session', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/interviews/3',
      payload: { notes: 'anonymous' },
    });

    expect(response.statusCode).toBe(401);
    expect(prismaMock.interview.updateMany).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/interviews/:id', () => {
  it('deletes a round on your own application', async () => {
    prismaMock.interview.deleteMany.mockResolvedValue({ count: 1 });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/interviews/3',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(204);
    expect(prismaMock.interview.deleteMany).toHaveBeenCalledWith({
      where: { id: 3, ...OWNED_BY_ALICE },
    });
  });

  it('404s for a round on somebody else application', async () => {
    prismaMock.interview.deleteMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/interviews/999',
      cookies: COOKIES,
    });

    // The delete was issued and matched nothing, which is the same answer as a
    // round that never existed.
    expect(response.statusCode).toBe(404);
  });

  it('rejects an id that is not a number', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/interviews/abc',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.interview.deleteMany).not.toHaveBeenCalled();
  });
});
