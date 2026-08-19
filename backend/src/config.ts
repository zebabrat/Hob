import 'dotenv/config';

/**
 * Every environment variable the server reads, validated once at startup.
 *
 * The point is failing loudly and early: a missing DATABASE_URL used to surface
 * as an exception thrown from inside the database module while serving the
 * first request. Here it is reported before anything listens, with every
 * problem listed at once rather than one per restart.
 */

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';

const DEFAULT_CORS_ORIGINS = [
  'https://hob-frontend-jet.vercel.app',
  'https://hob-frontend-hob10.vercel.app',
].join(',');

// Scoped to the frontend project and the team slug on purpose — a looser
// pattern like *.vercel.app would hand a session cookie to anyone's project.
const DEFAULT_PREVIEW_ORIGIN_PATTERN = String.raw`^https://hob-frontend-[a-z0-9-]+-hob10\.vercel\.app$`;

export interface Config {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  host: string;
  databaseUrl: string;
  /** Origins allowed to call the API with credentials, matched literally. */
  corsOrigins: string[];
  /** Extra origins allowed by shape — preview deployments get a fresh host. */
  corsOriginPattern: RegExp | null;
  /**
   * Write token for Vercel Blob, or null when it is not set.
   *
   * Deliberately not in the list above: attachments are one feature, and a
   * missing token should not stop the server from serving everything else.
   * The attachment routes answer 503 instead, which says the same thing at the
   * point where it actually matters.
   */
  blobToken: string | null;
}

function readConfig(env: NodeJS.ProcessEnv): Config {
  const problems: string[] = [];

  const databaseUrl = env['DATABASE_URL']?.trim();
  if (!databaseUrl) {
    problems.push('DATABASE_URL is missing — copy backend/.env.example to backend/.env');
  }

  const rawPort = env['PORT'] ?? String(DEFAULT_PORT);
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    problems.push(`PORT must be a port number, got ${JSON.stringify(rawPort)}`);
  }

  const corsOrigins = (env['CORS_ORIGIN'] ?? DEFAULT_CORS_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    problems.push('CORS_ORIGIN is empty — every browser request would be blocked');
  }
  if (corsOrigins.includes('*')) {
    // Browsers refuse `*` together with credentials, which every signed-in
    // request needs, so this would fail at runtime instead of loosening anything.
    problems.push('CORS_ORIGIN cannot be "*" — credentials require explicit origins');
  }

  const rawPattern = env['CORS_ORIGIN_PATTERN'] ?? DEFAULT_PREVIEW_ORIGIN_PATTERN;
  let corsOriginPattern: RegExp | null = null;
  if (rawPattern) {
    try {
      corsOriginPattern = new RegExp(rawPattern);
    } catch {
      problems.push(`CORS_ORIGIN_PATTERN is not a valid regular expression: ${rawPattern}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${problems.map((line) => `  - ${line}`).join('\n')}`,
    );
  }

  const nodeEnv = env['NODE_ENV'] ?? 'development';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port,
    host: env['HOST'] ?? DEFAULT_HOST,
    databaseUrl: databaseUrl as string,
    corsOrigins,
    corsOriginPattern,
    blobToken: env['BLOB_READ_WRITE_TOKEN']?.trim() || null,
  };
}

export const config = readConfig(process.env);

/** Exported for tests: lets them feed an environment without touching the real one. */
export { readConfig };
