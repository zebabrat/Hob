import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Set before config.js is evaluated, or the storage calls would be skipped.
vi.hoisted(() => {
  process.env['BLOB_READ_WRITE_TOKEN'] = 'vercel_blob_rw_test';
});

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    session: { findUnique: vi.fn(), delete: vi.fn() },
    attachment: { findFirst: vi.fn(), delete: vi.fn() },
  },
}));

const { blobMock } = vi.hoisted(() => ({
  blobMock: { put: vi.fn(), del: vi.fn() },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));
vi.mock('@vercel/blob', () => ({ put: blobMock.put, del: blobMock.del }));

const { buildApp } = await import('../app.js');

const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };
const COOKIES = { session: 'a'.repeat(64) };

const ATTACHMENT = { id: 4, blobUrl: 'https://blob.example/applications/10/cv.pdf' };

/** As with rounds, ownership is reached through the parent application. */
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

describe('DELETE /api/attachments/:id', () => {
  it('deletes the row and the stored file', async () => {
    prismaMock.attachment.findFirst.mockResolvedValue(ATTACHMENT);
    prismaMock.attachment.delete.mockResolvedValue(ATTACHMENT);
    blobMock.del.mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/attachments/4',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(204);
    expect(prismaMock.attachment.findFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: 4,
      ...OWNED_BY_ALICE,
    });
    expect(prismaMock.attachment.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(blobMock.del).toHaveBeenCalledWith(ATTACHMENT.blobUrl, expect.anything());
  });

  it('deletes the row before reaching for storage', async () => {
    const order: string[] = [];
    prismaMock.attachment.findFirst.mockResolvedValue(ATTACHMENT);
    prismaMock.attachment.delete.mockImplementation(async () => {
      order.push('row');
      return ATTACHMENT;
    });
    blobMock.del.mockImplementation(async () => {
      order.push('blob');
    });

    await app.inject({ method: 'DELETE', url: '/api/attachments/4', cookies: COOKIES });

    // The order is the point: if storage went first and the row delete failed,
    // the row would be left pointing at a file that is gone, which shows up as
    // a download that fails. This way a failure leaves an unreferenced file
    // instead, which costs storage and nothing else.
    expect(order).toEqual(['row', 'blob']);
  });

  it('succeeds even when the storage call fails', async () => {
    prismaMock.attachment.findFirst.mockResolvedValue(ATTACHMENT);
    prismaMock.attachment.delete.mockResolvedValue(ATTACHMENT);
    blobMock.del.mockRejectedValue(new Error('blob is down'));

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/attachments/4',
      cookies: COOKIES,
    });

    // Best effort: the row is already gone, so failing the request would be a
    // lie about what happened.
    expect(response.statusCode).toBe(204);
  });

  it('404s for an attachment on somebody else application', async () => {
    prismaMock.attachment.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/attachments/999',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('Attachment not found');
    // Nothing is touched in either place on the way to the 404.
    expect(prismaMock.attachment.delete).not.toHaveBeenCalled();
    expect(blobMock.del).not.toHaveBeenCalled();
  });

  it('401s without a session', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    const response = await app.inject({ method: 'DELETE', url: '/api/attachments/4' });

    expect(response.statusCode).toBe(401);
    expect(prismaMock.attachment.findFirst).not.toHaveBeenCalled();
  });
});
