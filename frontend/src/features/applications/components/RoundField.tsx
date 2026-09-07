import { ROUND_SUGGESTIONS } from '../helpers/presetValues'
import { ComboboxField } from './ComboboxField'

interface RoundFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  id?: string
}

/** Sized to match shared/components/ui/input's Input — this sits alongside plain TextFields in InterviewForm and the quick-add dialog, not the big create-form fields PositionField matches. */
export function RoundField({ value, onChange, disabled, required, id }: RoundFieldProps) {
  return (
    <ComboboxField
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      suggestions={ROUND_SUGGESTIONS}
      placeholder="Technical"
      className="h-8 border-input py-1 text-base text-foreground md:text-sm"
    />
  )
}
