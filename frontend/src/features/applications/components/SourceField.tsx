import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SOURCE_SUGGESTIONS } from '../helpers/presetValues'

interface SourceFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

/**
 * Same chip-and-dashed-input shape as LabelsField, plus a suggestions
 * dropdown under the input — an application can list more than one channel
 * (a referral who also saw the posting on LinkedIn), so this is a multi-add
 * rather than the single-pick PositionField, and "Referral" typed by hand is
 * exactly as valid as "Referral" clicked from the list.
 */
export function SourceField({ value, onChange, disabled }: SourceFieldProps) {
  const [draft, setDraft] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const query = draft.trim().toLowerCase()
  const matches = SOURCE_SUGGESTIONS.filter(
    (source) => !value.includes(source) && (!query || source.toLowerCase().includes(query)),
  )

  const add = (source: string) => {
    const trimmed = source.trim()
    setDraft('')
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <span className="mb-2.5 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
        Source
      </span>
      <div className="flex flex-wrap gap-2">
        {value.map((source) => (
          <span
            key={source}
            className="inline-flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.06em] text-foreground uppercase"
          >
            {source}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== source))}
                className="text-text-tertiary hover:text-foreground"
                aria-label={`Remove ${source}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <div className="relative">
          <input
            type="text"
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              add(draft)
              setIsOpen(false)
            }}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            placeholder="+ source"
            className="w-32 border border-dashed border-border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.06em] text-text-quaternary uppercase outline-none placeholder:text-text-quaternary focus:border-foreground focus:text-foreground"
          />
          {isOpen && matches.length > 0 && (
            <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-44 overflow-y-auto border border-border bg-card">
              {matches.map((source) => (
                <li key={source}>
                  <button
                    type="button"
                    // Runs before the input's onBlur, same reason as PositionField.
                    onMouseDown={(event) => {
                      event.preventDefault()
                      add(source)
                    }}
                    className="block w-full px-2.5 py-1.5 text-left font-mono text-[0.625rem] tracking-[0.06em] text-foreground uppercase hover:bg-muted"
                  >
                    {source}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
