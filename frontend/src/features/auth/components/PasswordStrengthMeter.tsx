import { scorePassword } from '@hob/shared'
import { cn } from 'shared/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
}

const CRITERIA: { key: keyof ReturnType<typeof scorePassword>['criteria']; label: string }[] = [
  { key: 'minLength', label: '8+ chars' },
  { key: 'hasUppercase', label: 'Uppercase' },
  { key: 'hasLowercase', label: 'Lowercase' },
  { key: 'hasDigit', label: 'Number' },
  { key: 'hasSymbol', label: 'Symbol' },
]

const LEVEL_FILL = { Weak: 1, Medium: 2, Strong: 3 } as const

/**
 * The sign-up form's strength meter: a three-segment bar for Weak/Medium/
 * Strong, plus the five criteria spelled out individually — sign-up only
 * accepts Strong, which means every one of them checked, so this is not
 * decoration, it is the actual list of what is still missing. Score and
 * copy come from the same scorePassword the backend enforces, so this can
 * never promise "good enough" for a password the API then rejects.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { level, criteria } = scorePassword(password)
  const filled = password.length === 0 ? 0 : LEVEL_FILL[level]

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5">
        {Array.from({ length: 3 }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-[3px] flex-1',
              index >= filled
                ? 'bg-border-weak'
                : level === 'Strong'
                  ? 'bg-highlight'
                  : 'bg-foreground',
            )}
          />
        ))}
      </div>

      <span className="mt-2 block font-mono text-[0.59375rem] tracking-[0.06em] text-text-secondary uppercase">
        {password.length === 0 ? 'Password strength' : level}
      </span>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {CRITERIA.map((item) => (
          <span
            key={item.key}
            className={cn(
              'border px-2 py-1 font-mono text-[0.5625rem] tracking-[0.05em] uppercase',
              criteria[item.key]
                ? 'border-foreground text-foreground'
                : 'border-border-weak text-text-tertiary',
            )}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
