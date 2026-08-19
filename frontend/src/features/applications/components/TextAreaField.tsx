import type { TextareaHTMLAttributes } from 'react'
import { Label } from 'shared/components/ui/label'
import { Textarea } from 'shared/components/ui/textarea'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  hint?: string
}

/**
 * shared/components/TextField's sibling, for the multi-line fields this
 * feature has three of (summary, notes, an interview round's notes). It stays
 * here rather than moving to shared/ — nothing outside applications needs a
 * textarea yet, and the promotion rule waits for that second feature to ask.
 */
export function TextAreaField({
  label,
  name,
  hint,
  id,
  rows = 3,
  ...textareaProps
}: TextAreaFieldProps) {
  const fieldId = id ?? name

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Textarea id={fieldId} name={name} rows={rows} {...textareaProps} />
      {hint && (
        <span className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase">
          {hint}
        </span>
      )}
    </div>
  )
}
