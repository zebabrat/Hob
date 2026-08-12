import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './origins.js';

describe('origin policy', () => {
  it('allows the production frontend domains', () => {
    expect(isAllowedOrigin('https://hob-frontend-jet.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://hob-frontend-hob10.vercel.app')).toBe(true);
  });

  it('allows preview deployments of the frontend project', () => {
    expect(isAllowedOrigin('https://hob-frontend-73a09obo0-hob10.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://hob-frontend-git-main-hob10.vercel.app')).toBe(true);
  });

  it('blocks other projects and look-alike hosts', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
    // Someone else's Vercel project must not match the preview pattern.
    expect(isAllowedOrigin('https://other-frontend-abc123-hob10.vercel.app')).toBe(false);
    expect(isAllowedOrigin('https://hob-frontend-abc123-otherteam.vercel.app')).toBe(false);
    // Suffix trick: the allowed host as a prefix of an attacker's domain.
    expect(isAllowedOrigin('https://hob-frontend-jet.vercel.app.evil.com')).toBe(false);
    // Same host over plain http is a different origin.
    expect(isAllowedOrigin('http://hob-frontend-jet.vercel.app')).toBe(false);
  });
});
