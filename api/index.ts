import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../backend/dist/app.js';

// Built once per warm instance and reused across invocations; ready() resolves
// the plugin queue a single time. Imports the compiled output rather than the
// TypeScript source because the build runs before functions are bundled.
const app = buildApp();
const ready = app.ready();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await ready;
  // Hands the raw request to Fastify's own router; no port is ever bound.
  app.server.emit('request', req, res);
}
