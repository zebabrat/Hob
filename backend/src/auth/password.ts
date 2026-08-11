import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash of a throwaway password. Compared against when the email is unknown so that
 * sign-in takes the same time either way and cannot be used to enumerate accounts.
 */
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.4kUQZbC1WMCWjV5H0dJ0kZ9Wc0Zu';

export function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function burnPasswordComparison(password: string): Promise<void> {
  await compare(password, DUMMY_HASH);
}
