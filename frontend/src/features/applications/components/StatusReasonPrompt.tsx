import { useState } from 'react'
import type { ApplicationStatus } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'

interface StatusReasonPromptProps {
  status: Extract<ApplicationStatus, 'REJECTED' | 'WITHDRAWN'>
  isSubmitting: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * Shown in place of the button that triggered a move to Rejected/Withdrawn —
 * "why" is worth capturing in the moment (a company that ghosted vs. one
 * that gave real feedback reads very differently three months later), but
 * never worth blocking on, so the reason is a plain optional textarea, not a
 * required field. Confirming with it blank still completes the move.
 */
export function StatusReasonPrompt({
  status,
  isSubmitting,
  onConfirm,
  onCancel,
}: StatusReasonPromptProps) {
  const [reason, setReason] = useState('')

  return (
    <div className="border border-border bg-zebra p-4">
      <span className="mb-2 block font-mono text-[0.59375rem] tracking-[0.1em] text-text-tertiary uppercase">
        Why {statusLabel(status).toLowerCase()}? Optional — saved as a note.
      </span>
      <textarea
        autoFocus
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Went with another offer, no response after final round…"
        rows={2}
        disabled={isSubmitting}
        className="w-full resize-none border-0 border-b border-border bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-text-tertiary"
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={isSubmitting}
          className="bg-foreground px-3.5 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-primary-foreground uppercase disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : statusLabel(status)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
