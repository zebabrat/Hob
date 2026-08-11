import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

export const app = buildApp();

// Entry point for a long-running process: local dev (`npm run dev`) and any
// host that runs `npm start`. Serverless entry points import buildApp instead
// and never bind a port.
try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
