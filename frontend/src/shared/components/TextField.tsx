import type { InputHTMLAttributes } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  hint?: string
}

/**
 * Composes shadcn's Input + Label rather than a hand-rolled input — every
 * call site (auth forms, application/interview forms) keeps working
 * unchanged, since the props this takes have not moved.
 */
export function TextField({ label, name, hint, id, ...inputProps }: TextFieldProps) {
  const fieldId = id ?? name

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} {...inputProps} />
      {hint && (
        <span className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase">
          {hint}
        </span>
      )}
    </div>
  )
}
