import { useState } from 'react'
import type { InterviewDto } from '@hob/shared'
import { FormError } from 'shared/components/FormError'
import { Button } from 'shared/components/ui/button'
import { interviewToFormValues } from '../helpers/formValues'
import type { InterviewFormValues } from '../types'
import { InterviewForm } from './InterviewForm'

interface InterviewListProps {
  interviews: InterviewDto[]
  pendingId: number | 'new' | null
  error: string | null
  onAdd: (values: InterviewFormValues) => Promise<boolean>
  onUpdate: (id: number, values: InterviewFormValues) => Promise<boolean>
  onDelete: (id: number) => void
}

function formatScheduledAt(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null
  return new Date(scheduledAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function InterviewList({
  interviews,
  pendingId,
  error,
  onAdd,
  onUpdate,
  onDelete,
}: InterviewListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  // Bumped after a successful add so the "new round" form below remounts
  // empty — its inputs are uncontrolled, so nothing else clears them.
  const [addFormKey, setAddFormKey] = useState(0)

  const handleAdd = async (values: InterviewFormValues) => {
    if (await onAdd(values)) setAddFormKey((key) => key + 1)
  }

  const handleUpdate = async (id: number, values: InterviewFormValues) => {
    if (await onUpdate(id, values)) setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/*
       * One error slot for add, edit and delete alike, rather than one per
       * form: the hook tracks a single error regardless of which action
       * caused it, and showing it only inside whichever form happens to be
       * open would misattribute a failed delete to an unrelated edit.
       */}
      <FormError message={error} />

      {interviews.length === 0 && (
        <p className="text-sm text-muted-foreground">No interview rounds yet.</p>
      )}

      {interviews.map((interview) =>
        editingId === interview.id ? (
          <InterviewForm
            key={interview.id}
            initialValues={interviewToFormValues(interview)}
            submitLabel="Save round"
            isSubmitting={pendingId === interview.id}
            error={null}
            onSubmit={(values) => void handleUpdate(interview.id, values)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={interview.id}
            className="flex items-start justify-between gap-3 rounded-md bg-muted p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{interview.round}</p>
              {formatScheduledAt(interview.scheduledAt) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatScheduledAt(interview.scheduledAt)}
                </p>
              )}
              {interview.notes && (
                <p className="mt-1 text-sm text-text-secondary">{interview.notes}</p>
              )}
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(interview.id)}
                disabled={pendingId === interview.id}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(interview.id)}
                disabled={pendingId === interview.id}
                className="text-destructive hover:text-destructive"
              >
                {pendingId === interview.id ? 'Removing…' : 'Delete'}
              </Button>
            </div>
          </div>
        ),
      )}

      <InterviewForm
        key={`new-${addFormKey}`}
        submitLabel="Add round"
        isSubmitting={pendingId === 'new'}
        error={null}
        onSubmit={(values) => void handleAdd(values)}
      />
    </div>
  )
}
