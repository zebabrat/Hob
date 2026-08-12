import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { Prisma } from './generated/prisma/client.js';
import { registerErrorHandler } from './errors.js';

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('database said no', {
    code,
    clientVersion: '7.9.1',
    meta,
  });
}

let app: FastifyInstance;

beforeEach(async () => {
  app = Fastify({ logger: false });
  registerErrorHandler(app);

  app.post('/things/:id', async (request) => {
    const { code, meta } = request.body as { code: string; meta?: Record<string, unknown> };
    throw prismaError(code, meta);
  });

  app.get('/boom', async () => {
    throw new Error('something unrelated');
  });

  app.post(
    '/validated',
    { schema: { body: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } },
    async () => ({ ok: true }),
  );

  await app.ready();
});

describe('database errors', () => {
  it('turns a unique email into 409 naming the value', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/things/1',
      payload: { code: 'P2002', meta: { target: ['email'] }, email: 'alice@example.com' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'Email alice@example.com is already taken',
    });
  });

  it('reads the constraint the pg driver adapter reports', async () => {
    // The shape this project actually receives in production — Prisma's own
    // meta.target is absent when a driver adapter is in play.
    const response = await app.inject({
      method: 'POST',
      url: '/things/1',
      payload: {
        code: 'P2002',
        meta: {
          modelName: 'User',
          driverAdapterError: {
            name: 'DriverAdapterError',
            cause: {
              originalCode: '23505',
              kind: 'UniqueConstraintViolation',
              constraint: { fields: ['email'] },
            },
          },
        },
        email: 'alice@example.com',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Email alice@example.com is already taken');
  });

  it('recognises the email through an index name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/things/1',
      payload: {
        code: 'P2002',
        meta: { driverAdapterError: { cause: { constraint: { index: 'User_email_key' } } } },
        email: 'alice@example.com',
      },
    });

    expect(response.json().message).toBe('Email alice@example.com is already taken');
  });

  it('stays generic when the conflict is not about the email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/things/1',
      payload: { code: 'P2002', meta: { target: ['slug'] }, email: 'alice@example.com' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('That value is already taken');
  });

  it('turns a missing record into 404 naming the id from the route', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/things/42',
      payload: { code: 'P2025' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('User with id 42 not found');
  });

  it('answers 500 for any other database failure without leaking it', async () => {
    const logged = vi.fn();
    app.log.error = logged as never;

    const response = await app.inject({
      method: 'POST',
      url: '/things/1',
      payload: { code: 'P1001' },
    });

    expect(response.statusCode).toBe(500);
    // The query, the connection string and the Prisma code stay in the logs.
    expect(response.body).not.toContain('database said no');
    expect(response.body).not.toContain('P1001');
  });
});

describe('everything else', () => {
  it('leaves ordinary errors to Fastify', async () => {
    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
  });

  it('keeps schema validation answering 400', async () => {
    const response = await app.inject({ method: 'POST', url: '/validated', payload: {} });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain('name');
  });
});
