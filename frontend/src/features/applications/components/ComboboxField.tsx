import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { cn } from 'shared/lib/utils'

interface ComboboxFieldProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  /** Sizing/color are the caller's call — PositionField and RoundField sit at two different type scales, and neither is the "default" the other overrides. */
  className?: string
}

/**
 * A text field that doubles as its own dropdown and search box — typing
 * filters `suggestions` in place rather than opening a separate search
 * input, and whatever is typed is a valid value on its own even when it
 * matches nothing on the list (every caller's list is a shortlist, not a
 * closed vocabulary — see presetValues.ts). Shared by PositionField and
 * RoundField rather than duplicated: the dropdown/keyboard-nav logic below
 * is identical between them, only the suggestion list and visual scale
 * differ.
 */
export function ComboboxField({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  required,
  id,
  className,
}: ComboboxFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim().toLowerCase()
  const matches = query
    ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(query))
    : suggestions

  const commit = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((current) => Math.min(current + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && isOpen && matches[highlighted]) {
      event.preventDefault()
      commit(matches[highlighted])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setHighlighted(0)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        className={cn(
          'w-full border-0 border-b bg-transparent outline-none placeholder:text-text-tertiary',
          className,
        )}
      />
      {isOpen && matches.length > 0 && (
        <ul className="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto border border-border bg-card">
          {matches.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                // Fires before the input's onBlur closes the list — a plain
                // onClick would never run, since blur already hid the list.
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(suggestion)
                }}
                className={
                  index === highlighted
                    ? 'block w-full px-3 py-2 text-left text-sm text-foreground bg-muted'
                    : 'block w-full px-3 py-2 text-left text-sm text-foreground'
                }
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
