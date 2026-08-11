/**
 * Which browser origins may call this API with credentials.
 *
 * A wildcard is not an option: browsers reject `*` together with credentials,
 * which every authenticated call needs. Production domains are matched
 * literally; preview deployments get a pattern instead, because their host
 * carries a fresh build hash every time (hob-frontend-<hash>-hob10.vercel.app).
 */

const DEFAULT_ORIGINS = [
  'https://hob-frontend-jet.vercel.app',
  'https://hob-frontend-hob10.vercel.app',
].join(',');

// Scoped to the frontend project and the team slug on purpose — a looser
// pattern like *.vercel.app would hand a session cookie to anyone's project.
const DEFAULT_PREVIEW_PATTERN = String.raw`^https://hob-frontend-[a-z0-9-]+-hob10\.vercel\.app$`;

const allowedOrigins = (process.env['CORS_ORIGIN'] ?? DEFAULT_ORIGINS)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const previewPatternSource = process.env['CORS_ORIGIN_PATTERN'] ?? DEFAULT_PREVIEW_PATTERN;
const previewPattern = previewPatternSource ? new RegExp(previewPatternSource) : null;

export function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) || previewPattern?.test(origin) === true;
}

/** Exposed for logging at startup — useful when a preview deploy gets blocked. */
export const originPolicy = {
  allowed: allowedOrigins,
  previewPattern: previewPattern?.source ?? null,
};
