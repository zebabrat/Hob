/**
 * Password strength — shared so the sign-up form's live meter and the
 * backend's own rejection of weak passwords can never disagree about what
 * "strong enough" means.
 *
 * Composition rules, by explicit product decision: a password only counts
 * as Strong once it has a lowercase letter, an uppercase letter, a digit,
 * a symbol, and is at least 8 characters — Weak/Medium are informational
 * only, sign-up requires Strong to submit.
 */

/**
 * A short list of the passwords that show up at the top of every breach
 * corpus — not a general dictionary (that would need a real wordlist and a
 * network fetch), just the handful common enough that even one meeting
 * every composition rule must still be refused. Checked case-insensitively.
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'qwerty123',
  'letmein123',
  'iloveyou',
  'admin1234',
  'welcome123',
  'monkey123',
  'football1',
  'baseball1',
  'dragon123',
  'trustno1',
  'sunshine1',
  'princess1',
  'starwars1',
  '11111111',
  '00000000',
  'abcd1234',
  'abc12345',
  'changeme',
  'letmein1',
]);

export const PASSWORD_STRENGTH_LEVELS = ['Weak', 'Medium', 'Strong'] as const;
export type PasswordStrengthLevel = (typeof PASSWORD_STRENGTH_LEVELS)[number];

/** Only a Strong password — every composition rule met — is accepted at sign-up. */
export const REQUIRED_PASSWORD_STRENGTH: PasswordStrengthLevel = 'Strong';

export interface PasswordCriteria {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
}

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  criteria: PasswordCriteria;
  /** How many of the five criteria are met — drives the meter's fill. */
  metCount: number;
}

function checkCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
}

/**
 * Weak below 3 of the 5 criteria, Medium at 3–4, Strong only at all 5 — and
 * a password on the common-password list is floored to Weak regardless of
 * how many boxes it otherwise ticks, since "Password123!" checks every box
 * and is still one of the first guesses a real attacker makes.
 */
export function scorePassword(password: string): PasswordStrength {
  const criteria = checkCriteria(password);
  const metCount = Object.values(criteria).filter(Boolean).length;
  const isCommon = password.length > 0 && COMMON_PASSWORDS.has(password.toLowerCase());

  let level: PasswordStrengthLevel;
  if (isCommon) level = 'Weak';
  else if (metCount === 5) level = 'Strong';
  else if (metCount >= 3) level = 'Medium';
  else level = 'Weak';

  return { level, criteria, metCount: isCommon ? Math.min(metCount, 2) : metCount };
}

export function isPasswordStrongEnough(password: string): boolean {
  return scorePassword(password).level === REQUIRED_PASSWORD_STRENGTH;
}
