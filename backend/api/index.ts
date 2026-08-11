import type { IncomingMessage, ServerResponse } from 'node:http';
import Fastify from 'fastify';
import { fastifyOptions, registerApp } from '../dist/app.js';

// One instance per warm container; ready() resolves the plugin queue once.
// Fastify is constructed here rather than imported ready-made so this file
// carries the framework import itself. The compiled backend is imported
// because the build runs before functions are bundled.
const app = registerApp(Fastify(fastifyOptions));
const ready = app.ready();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await ready;
  // Hands the raw request to Fastify's router; no port is ever bound.
  app.server.emit('request', req, res);
}
