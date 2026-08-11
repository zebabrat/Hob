import { buildApp } from './backend/dist/app.js';

/**
 * Entry point Vercel looks for at the root of the project (app|index|server).
 * It exports the configured Fastify instance without binding a port — the
 * platform calls ready() and routes requests into it. The compiled output is
 * imported rather than the TypeScript source because the build runs first.
 *
 * Long-running hosts use backend/src/index.ts instead, which does listen.
 */
export default buildApp();
