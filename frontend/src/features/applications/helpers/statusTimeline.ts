import type { ApplicationDto, ApplicationStatus } from '@hob/shared'

/** The forward path a normal application takes, plus the outcome rung the mockup calls "Decision". */
export const PIPELINE_STEPS: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

const TERMINAL_STATUSES: ApplicationStatus[] = ['ACCEPTED', 'REJECTED', 'WITHDRAWN']

/** Days from application to a terminal outcome, or to now if still open — the detail hero's "In process" metric. */
export function daysInProcess(application: ApplicationDto, now: Date = new Date()): number {
  const resolvedAt = TERMINAL_STATUSES.includes(application.status)
    ? (application.statusChanges.find((change) => change.toStatus === application.status)
        ?.changedAt ?? application.updatedAt)
    : now.toISOString()

  const days = (Date.parse(resolvedAt) - Date.parse(application.appliedDate)) / (24 * 60 * 60 * 1000)
  return Math.max(0, Math.round(days))
}

export interface TimelineStep {
  status: ApplicationStatus
  /** When the application first reached this status, from the real audit trail — null if it never has. */
  enteredAt: string | null
  isPast: boolean
  isCurrent: boolean
}

/**
 * The right sidebar's "Status" list: the four forward steps with their real
 * entry dates (built from StatusChange, the audit trail already written on
 * every transition — no invented dates), plus whether a terminal outcome has
 * been reached yet for the fifth "Decision" rung.
 */
export function buildStatusTimeline(application: ApplicationDto): {
  steps: TimelineStep[]
  decision: { reached: boolean; status: ApplicationStatus | null; enteredAt: string | null }
} {
  const firstEntryOf = (status: ApplicationStatus): string | null =>
    application.statusChanges.find((change) => change.toStatus === status)?.changedAt ?? null

  const isTerminal = TERMINAL_STATUSES.includes(application.status)
  const currentIndex = isTerminal ? -1 : PIPELINE_STEPS.indexOf(application.status)

  const steps = PIPELINE_STEPS.map((status, index) => ({
    status,
    enteredAt: firstEntryOf(status),
    // A terminal application (rejected/withdrawn/accepted) passed through
    // every forward step it has a real entry date for, regardless of where
    // application.status itself ended up.
    isPast: isTerminal ? firstEntryOf(status) !== null && status !== application.status : index < currentIndex,
    isCurrent: !isTerminal && index === currentIndex,
  }))

  const decisionStatus = TERMINAL_STATUSES.find((status) => application.status === status) ?? null

  return {
    steps,
    decision: {
      reached: decisionStatus !== null,
      status: decisionStatus,
      enteredAt: decisionStatus ? firstEntryOf(decisionStatus) : null,
    },
  }
}
