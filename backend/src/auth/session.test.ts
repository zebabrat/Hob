import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

const { createSession, deleteExpiredSessions, deleteSession, findSessionUser } = await import(
  './session.js'
);

const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.session.create.mockResolvedValue({ id: 1 });
  prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });
});

describe('createSession', () => {
  it('stores only the hash and returns the raw token', async () => {
    const token = await createSession(1);

    expect(token).toMatch(/^[0-9a-f]{64}$/);

    const stored = prismaMock.session.create.mock.calls[0]?.[0]?.data;
    // The value in the database must not be replayable as a cookie.
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toBe(sha256(token));
    expect(JSON.stringify(stored)).not.toContain(token);
  });

  it('gives out a different token every time', async () => {
    const [first, second] = [await createSession(1), await createSession(1)];

    expect(first).not.toBe(second);
  });

  it('clears expired sessions along the way', async () => {
    await createSession(1);

    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: expect.any(Date) } },
    });
  });

  it('still returns a token when the cleanup fails', async () => {
    prismaMock.session.deleteMany.mockRejectedValue(new Error('database busy'));

    // Housekeeping must never cost a user their sign-in.
    await expect(createSession(1)).resolves.toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('findSessionUser', () => {
  it('looks the session up by hash, never by the raw token', async () => {
    prismaMock.session.findUnique.mockResolvedValue({
      id: 1,
      expiresAt: new Date(Date.now() + 60_000),
      user: ALICE,
    });

    await findSessionUser('deadbeef');

    expect(prismaMock.session.findUnique.mock.calls[0]?.[0]?.where).toEqual({
      tokenHash: sha256('deadbeef'),
    });
  });

  it('returns null and deletes the row for an expired session', async () => {
    prismaMock.session.findUnique.mockResolvedValue({
      id: 9,
      expiresAt: new Date(Date.now() - 1),
      user: ALICE,
    });
    prismaMock.session.delete.mockResolvedValue({ id: 9 });

    await expect(findSessionUser('deadbeef')).resolves.toBeNull();
    expect(prismaMock.session.delete).toHaveBeenCalledWith({ where: { id: 9 } });
  });

  it('returns null for an unknown token', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    await expect(findSessionUser('nope')).resolves.toBeNull();
  });
});

describe('deleteSession', () => {
  it('deletes by hash', async () => {
    await deleteSession('deadbeef');

    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: sha256('deadbeef') },
    });
  });
});

describe('deleteExpiredSessions', () => {
  it('reports how many rows went', async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 3 });

    await expect(deleteExpiredSessions()).resolves.toBe(3);
  });
});
