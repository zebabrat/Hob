import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { HealthResponse } from '@hob/shared';
import { isAllowedOrigin } from './auth/origins.js';
import { config } from './config.js';
import { registerErrorHandler } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';

export const fastifyOptions: FastifyServerOptions = {
  // Request logs are noise in the test output; everywhere else they are wanted.
  logger: config.nodeEnv !== 'test',
  // Fastify strips unknown body fields by default; we want an explicit 400 so a
  // typo in the request body cannot pass unnoticed.
  ajv: { customOptions: { removeAdditional: false } },
};

/**
 * Attaches plugins and routes. Registration is not awaited so callers get the
 * instance back synchronously — Fastify resolves the queue on `ready()`, which
 * serverless hosts call themselves.
 *
 * Kept separate from instance creation so that each entry point constructs its
 * own Fastify object: the deployment platform decides which framework it is
 * dealing with by looking at the imports of the entry file itself.
 */
export function registerApp(app: FastifyInstance): FastifyInstance {
  registerErrorHandler(app);

  app.register(cors, {
    origin: (origin, callback) => {
      // No Origin header means it is not a browser cross-site request
      // (curl, health checks, server-to-server) — nothing to guard here.
      callback(null, origin === undefined || isAllowedOrigin(origin));
    },
    credentials: true,
    // @fastify/cors defaults to GET,HEAD,POST — without this the users routes
    // would fail their preflight cross-origin.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  });
  app.register(cookie);

  // Security headers. No HTML is served, so the CSP that helmet installs by
  // default only ever applies to JSON — harmless, and it still covers the
  // cases that matter for an API: nosniff, frame denial, referrer policy.
  app.register(helmet);

  // A ceiling for the whole API; the auth routes tighten it further. The store
  // is per instance, so on serverless this bounds one container rather than the
  // fleet — enough to make password guessing impractical, not a substitute for
  // an edge-level limiter.
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/api/health', async (): Promise<HealthResponse> => {
    return { status: 'ok' };
  });

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });

  return app;
}

/** Convenience for entry points that do not need to touch the raw instance. */
export function buildApp(): FastifyInstance {
  return registerApp(Fastify(fastifyOptions));
}
