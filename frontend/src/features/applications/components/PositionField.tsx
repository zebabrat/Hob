import { POSITION_SUGGESTIONS } from '../helpers/presetValues'
import { ComboboxField } from './ComboboxField'

interface PositionFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  id?: string
}

/** The big-type combobox used on the two "hero" fields of the create/edit forms — see ComboboxField for the shared dropdown logic. */
export function PositionField({ value, onChange, disabled, required, id }: PositionFieldProps) {
  return (
    <ComboboxField
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      suggestions={POSITION_SUGGESTIONS}
      placeholder="Backend Engineer"
      className="border-foreground py-2.5 text-[1.1875rem] text-foreground"
    />
  )
}
