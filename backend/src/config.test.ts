import { describe, expect, it } from 'vitest';
import { readConfig } from './config.js';

const VALID = { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' };

describe('readConfig', () => {
  it('fills in the defaults around the database URL', () => {
    const config = readConfig(VALID);

    expect(config).toMatchObject({ port: 3001, host: '0.0.0.0', isProduction: false });
    expect(config.corsOrigins).toContain('https://hob-frontend-jet.vercel.app');
    expect(config.corsOriginPattern?.test('https://hob-frontend-abc123-hob10.vercel.app')).toBe(
      true,
    );
  });

  it('reports a missing database URL with a way out', () => {
    expect(() => readConfig({})).toThrow(/DATABASE_URL is missing.*\.env\.example/s);
  });

  it('lists every problem at once instead of one per restart', () => {
    const error = (() => {
      try {
        readConfig({ PORT: 'http', CORS_ORIGIN_PATTERN: '(' });
        return null;
      } catch (err) {
        return err as Error;
      }
    })();

    expect(error?.message).toContain('DATABASE_URL');
    expect(error?.message).toContain('PORT');
    expect(error?.message).toContain('CORS_ORIGIN_PATTERN');
  });

  it('rejects a wildcard origin, which browsers would refuse anyway', () => {
    expect(() => readConfig({ ...VALID, CORS_ORIGIN: '*' })).toThrow(/cannot be "\*"/);
  });

  it('rejects a port that is not a port', () => {
    expect(() => readConfig({ ...VALID, PORT: '70000' })).toThrow(/PORT/);
    expect(() => readConfig({ ...VALID, PORT: '3001.5' })).toThrow(/PORT/);
  });

  it('takes an explicit origin list over the defaults', () => {
    const config = readConfig({
      ...VALID,
      CORS_ORIGIN: 'https://a.example.com, https://b.example.com',
    });

    expect(config.corsOrigins).toEqual(['https://a.example.com', 'https://b.example.com']);
  });
});
