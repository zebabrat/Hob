import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import type { HealthResponse } from '@hob/shared';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

// Comma-separated list; overriding it is how preview deployments and local
// cross-origin runs get in. A wildcard is deliberately not supported: browsers
// reject `*` together with credentials, which every authenticated call needs.
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'https://hob-frontend-jet.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = Fastify({
  logger: true,
  // Fastify strips unknown body fields by default; we want an explicit 400 so a
  // typo in the request body cannot pass unnoticed.
  ajv: { customOptions: { removeAdditional: false } },
});

await app.register(cors, {
  origin: CORS_ORIGINS,
  credentials: true,
  // @fastify/cors defaults to GET,HEAD,POST — without this the users routes
  // would fail their preflight cross-origin.
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
});
await app.register(cookie);

app.get('/api/health', async (): Promise<HealthResponse> => {
  return { status: 'ok' };
});

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(usersRoutes, { prefix: '/api/users' });

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
