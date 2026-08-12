import { describe, expect, it } from 'vitest';
import { burnPasswordComparison, hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('accepts the password it hashed', async () => {
    const hash = await hashPassword('supersecret');

    expect(hash).not.toBe('supersecret');
    await expect(verifyPassword('supersecret', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('supersecret');

    await expect(verifyPassword('supersecrer', hash)).resolves.toBe(false);
  });

  it('produces a different hash for the same password', async () => {
    const [first, second] = await Promise.all([
      hashPassword('supersecret'),
      hashPassword('supersecret'),
    ]);

    // Different salts — equal hashes would mean the salt is not random.
    expect(first).not.toBe(second);
  });

  it('burns a comparison without throwing on an unknown account', async () => {
    await expect(burnPasswordComparison('supersecret')).resolves.toBeUndefined();
  });
});
