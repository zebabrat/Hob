import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ApplicationStatus } from '@hob/shared'
import { DATETIME_INPUT_MAX, DATETIME_INPUT_MIN } from 'shared/helpers/dateBounds'
import { statusLabel } from 'shared/helpers/labels'
import { FormError } from 'shared/components/FormError'
import { SubmitButton } from 'shared/components/SubmitButton'
import { Button } from 'shared/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from 'shared/components/ui/dialog'
import { Label } from 'shared/components/ui/label'
import { RoundField } from './RoundField'

/**
 * Screening is always one homogeneous call — naming it would be a field
 * nobody fills in meaningfully, so its round is fixed and never shown to
 * the user. Interview rounds are the opposite: technical, culture fit, a
 * second interview — genuinely distinct, so that field asks for a name.
 */
const DEFAULT_ROUND_NAME: Record<'SCREENING' | 'INTERVIEW', string> = {
  SCREENING: 'Screening',
  INTERVIEW: '',
}

interface AddRoundDialogProps {
  status: Extract<ApplicationStatus, 'SCREENING' | 'INTERVIEW'>
  isSubmitting: boolean
  error: string | null
  onSave: (round: string, scheduledAt: string) => void
  onSkip: () => void
}

/**
 * Offered right after a card lands on Screening or Interview — the moment a
 * call actually gets scheduled is the same moment the card moves column, so
 * capturing the date here saves a second trip to the detail page. Entirely
 * skippable: the status move itself already happened before this dialog
 * opens (see KanbanBoard), so declining loses nothing but the round record.
 * A second, third round for the same stage (technical, then culture fit)
 * still goes through the detail page's own "Add round" — the card only
 * moves column once, so only the first round has a drag to hang off of.
 */
export function AddRoundDialog({ status, isSubmitting, error, onSave, onSkip }: AddRoundDialogProps) {
  const [round, setRound] = useState(DEFAULT_ROUND_NAME[status])
  const showRoundField = status === 'INTERVIEW'
  const [scheduledAt, setScheduledAt] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(round, scheduledAt)
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onSkip() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="font-mono text-xs tracking-[0.09em] uppercase">
          When's the {statusLabel(status).toLowerCase()}?
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          Optional — shows up on the card once it's set.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-2 flex flex-col gap-4">
          <FormError message={error} />

          {showRoundField && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-round-name">Round</Label>
              <RoundField
                id="add-round-name"
                value={round}
                onChange={setRound}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-round-scheduled-at">Scheduled at</Label>
            <input
              id="add-round-scheduled-at"
              type="datetime-local"
              autoFocus
              min={DATETIME_INPUT_MIN}
              max={DATETIME_INPUT_MAX}
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={isSubmitting}
              className="h-8 w-full border-0 border-b border-input bg-transparent text-base outline-none focus-visible:border-foreground md:text-sm"
            />
          </div>

          {/*
           * grid, not flex: two children both asking for the full row's
           * width (Button and SubmitButton each set their own `w-full`)
           * overflow a flex row in a dialog this narrow — flexbox's default
           * min-width:auto refuses to shrink either button below its own
           * content size, so together they spill past the dialog edge. A
           * fixed two-column grid divides the row exactly in half instead.
           */}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={onSkip} disabled={isSubmitting} className="w-full">
              Skip
            </Button>
            <SubmitButton isSubmitting={isSubmitting} pendingLabel="Saving…">
              Save
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
