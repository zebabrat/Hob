import { buildApp } from './app.js';
import { config } from './config.js';

export const app = buildApp();

// Entry point for a long-running process: local dev (`npm run dev`) and any
// host that runs `npm start`. Serverless entry points import buildApp instead
// and never bind a port.
try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
