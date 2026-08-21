import { useState } from 'react'
import type { KeyboardEvent } from 'react'

interface LabelsFieldProps {
  labels: string[]
  onChange: (labels: string[]) => void
  disabled?: boolean
}

/**
 * Freeform tag chips — "Метки: chips с крестиком для удаления + пунктирная
 * chip '+ метка' для добавления". A solid chip per existing label, a dashed
 * one that is really a text input in disguise for adding the next.
 */
export function LabelsField({ labels, onChange, disabled }: LabelsFieldProps) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim()
    setDraft('')
    if (!value || labels.includes(value)) return
    onChange([...labels, value])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  }

  return (
    <div>
      <span className="mb-2.5 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
        Labels
      </span>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.06em] text-foreground uppercase"
          >
            {label}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(labels.filter((item) => item !== label))}
                className="text-text-tertiary hover:text-foreground"
                aria-label={`Remove ${label}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder="+ label"
          className="w-24 border border-dashed border-border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.06em] text-text-quaternary uppercase outline-none placeholder:text-text-quaternary focus:border-foreground focus:text-foreground"
        />
      </div>
    </div>
  )
}
