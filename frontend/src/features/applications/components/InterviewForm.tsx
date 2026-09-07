import { useState } from 'react'
import type { FormEvent } from 'react'
import { DATETIME_INPUT_MAX, DATETIME_INPUT_MIN } from 'shared/helpers/dateBounds'
import { FormError } from 'shared/components/FormError'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'
import { Button } from 'shared/components/ui/button'
import { Label } from 'shared/components/ui/label'
import { readInterviewValues } from '../helpers/formValues'
import type { InterviewFormValues } from '../types'
import { RoundField } from './RoundField'
import { TextAreaField } from './TextAreaField'

interface InterviewFormProps {
  /** Present for editing an existing round; omitted, the form starts blank. */
  initialValues?: InterviewFormValues
  submitLabel: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (values: InterviewFormValues) => void
  /** Only the edit instance offers a way out without saving. */
  onCancel?: () => void
  /**
   * Set only on the blank "add a new round" instance while the application
   * is still in Screening — that stage is one homogeneous call, so asking
   * for a name is a field nobody fills in meaningfully. Silently fixes the
   * round to this name and hides the field, same as AddRoundDialog. Editing
   * an existing round always shows the field regardless of stage: it may
   * already carry a real name from before the application reached Screening
   * again, or from before this rule existed.
   */
  lockedRoundName?: string
}

export function InterviewForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  lockedRoundName,
}: InterviewFormProps) {
  // A combobox, unlike the rest of this form's fields, needs its live value
  // in React state rather than read off the DOM at submit time — see
  // ComboboxField.
  const [round, setRound] = useState(initialValues?.round ?? lockedRoundName ?? '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(readInterviewValues(event.currentTarget, round))
  }

  return (
    // A background fill, not a border, separates this from the list above it.
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <FormError message={error} />

      {!lockedRoundName && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interview-round">Round</Label>
          <RoundField id="interview-round" value={round} onChange={setRound} required disabled={isSubmitting} />
        </div>
      )}

      <TextField
        label="Scheduled at"
        name="scheduledAt"
        type="datetime-local"
        min={DATETIME_INPUT_MIN}
        max={DATETIME_INPUT_MAX}
        defaultValue={initialValues?.scheduledAt}
        hint="Optional"
        disabled={isSubmitting}
      />

      <TextAreaField
        label="Notes"
        name="notes"
        rows={2}
        defaultValue={initialValues?.notes}
        hint="Optional"
        disabled={isSubmitting}
      />

      {/* grid only when there are two w-full buttons to divide evenly — see AddRoundDialog for why flex overflows in that case. One button (no onCancel) has nothing to divide, so it stays flex. */}
      <div className={onCancel ? 'grid grid-cols-2 gap-3' : 'flex gap-3'}>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </Button>
        )}
        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  )
}
