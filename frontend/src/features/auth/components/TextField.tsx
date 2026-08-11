import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  hint?: string
}

export function TextField({ label, name, hint, ...inputProps }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      <input
        {...inputProps}
        name={name}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-300 dark:focus:ring-neutral-100/10"
      />
      {hint && (
        <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
      )}
    </label>
  )
}
