import type { FormEvent } from 'react'
import { FormError } from 'shared/components/FormError'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'
import { Button } from 'shared/components/ui/button'
import { readInterviewValues } from '../helpers/formValues'
import type { InterviewFormValues } from '../types'
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
}

export function InterviewForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: InterviewFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(readInterviewValues(event.currentTarget))
  }

  return (
    // A background fill, not a border, separates this from the list above it.
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <FormError message={error} />

      <TextField
        label="Round"
        name="round"
        placeholder="Technical"
        defaultValue={initialValues?.round}
        required
        disabled={isSubmitting}
      />

      <TextField
        label="Scheduled at"
        name="scheduledAt"
        type="datetime-local"
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

      <div className="flex gap-3">
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
