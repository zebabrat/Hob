import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import type { HealthResponse } from '@hob/shared';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';

// Comma-separated list; overriding it is how preview deployments and local
// cross-origin runs get in. A wildcard is deliberately not supported: browsers
// reject `*` together with credentials, which every authenticated call needs.
const CORS_ORIGINS = (process.env['CORS_ORIGIN'] ?? 'https://hob-frontend-jet.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Builds the configured server without binding a port. Plugins are registered
 * without awaiting so the instance can be returned synchronously — Fastify
 * resolves the queue on `ready()`, which serverless hosts call themselves.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    // Fastify strips unknown body fields by default; we want an explicit 400 so a
    // typo in the request body cannot pass unnoticed.
    ajv: { customOptions: { removeAdditional: false } },
  });

  app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
    // @fastify/cors defaults to GET,HEAD,POST — without this the users routes
    // would fail their preflight cross-origin.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  });
  app.register(cookie);

  app.get('/api/health', async (): Promise<HealthResponse> => {
    return { status: 'ok' };
  });

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });

  return app;
}
