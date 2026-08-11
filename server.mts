import Fastify from 'fastify';
import { fastifyOptions, registerApp } from './backend/dist/app.js';

/**
 * Entry point Vercel looks for at the root of the project. It builds the server
 * here — rather than importing a ready-made instance — because the platform
 * detects the framework from this file's own imports.
 *
 * No port is bound: the platform calls ready() and routes requests in. Compiled
 * output is imported because the build runs before this file is bundled.
 *
 * Long-running hosts use backend/src/index.ts instead, which does listen.
 */
const app = Fastify(fastifyOptions);
registerApp(app);

export default app;
