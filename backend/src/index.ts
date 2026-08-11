import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import type { HealthResponse } from '@hob/shared';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

export const app = Fastify({
  logger: true,
  // Fastify strips unknown body fields by default; we want an explicit 400 so a
  // typo in the request body cannot pass unnoticed.
  ajv: { customOptions: { removeAdditional: false } },
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
