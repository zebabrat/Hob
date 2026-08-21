import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from 'shared/components/ui/input'
import { Label } from 'shared/components/ui/label'
import { cn } from 'shared/lib/utils'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  name: string
  hint?: string
}

/**
 * The same underlined field as TextField, plus the show/hide toggle every
 * password input gets — typed as dots by default, a click away from plain
 * text so a typo is easy to catch before submitting.
 */
export function PasswordField({ label, name, hint, id, className, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const fieldId = id ?? name

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          name={name}
          type={visible ? 'text' : 'password'}
          className={cn('pr-7', className)}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Out of the form's own tab order — the field itself and the
          // submit button are what tabbing through this form should reach.
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-0 -translate-y-1/2 text-text-tertiary hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && (
        <span className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase">
          {hint}
        </span>
      )}
    </div>
  )
}
