import { config } from '../config.js';

/**
 * Which browser origins may call this API with credentials.
 *
 * A wildcard is not an option: browsers reject `*` together with credentials,
 * which every authenticated call needs. Production domains are matched
 * literally; preview deployments get a pattern instead, because their host
 * carries a fresh build hash every time (hob-frontend-<hash>-hob10.vercel.app).
 */
export function isAllowedOrigin(origin: string): boolean {
  return (
    config.corsOrigins.includes(origin) || config.corsOriginPattern?.test(origin) === true
  );
}
