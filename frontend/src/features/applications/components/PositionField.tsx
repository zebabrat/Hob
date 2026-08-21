import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { POSITION_SUGGESTIONS } from '../helpers/presetValues'

interface PositionFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  id?: string
}

/**
 * A text field that doubles as its own dropdown and search box — typing
 * filters POSITION_SUGGESTIONS in place rather than opening a separate
 * search input, and whatever is typed is a valid value on its own even when
 * it matches nothing on the list (the list is a shortlist, not a closed
 * vocabulary — see presetValues.ts).
 */
export function PositionField({ value, onChange, disabled, required, id }: PositionFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim().toLowerCase()
  const matches = query
    ? POSITION_SUGGESTIONS.filter((position) => position.toLowerCase().includes(query))
    : POSITION_SUGGESTIONS

  const commit = (position: string) => {
    onChange(position)
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
        placeholder="Backend Engineer"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        className="w-full border-0 border-b border-foreground bg-transparent py-2.5 text-[1.1875rem] text-foreground outline-none placeholder:text-text-tertiary"
      />
      {isOpen && matches.length > 0 && (
        <ul className="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto border border-border bg-card">
          {matches.map((position, index) => (
            <li key={position}>
              <button
                type="button"
                // Fires before the input's onBlur closes the list — a plain
                // onClick would never run, since blur already hid the list.
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(position)
                }}
                className={
                  index === highlighted
                    ? 'block w-full px-3 py-2 text-left text-sm text-foreground bg-muted'
                    : 'block w-full px-3 py-2 text-left text-sm text-foreground'
                }
              >
                {position}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
