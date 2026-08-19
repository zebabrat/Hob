import type { ApplicationStatus, WorkFormat } from '@hob/shared'

/**
 * The canonical display text for each status and work format — the single
 * place both the board and the analytics page read it from, so a status
 * cannot end up spelled two different ways on two different screens.
 */
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export function statusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status]
}

const WORK_FORMAT_LABELS: Record<WorkFormat, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

export function workFormatLabel(workFormat: WorkFormat | null): string | null {
  return workFormat ? WORK_FORMAT_LABELS[workFormat] : null
}

/**
 * One flat tint per status, for the kanban card and the detail page's status
 * badge. Written as a lookup of literal class strings rather than built from
 * the status at runtime (`bg-status-${status.toLowerCase()}`) — Tailwind's
 * scanner only finds classes it can see as whole strings in the source, so a
 * templated one would never make it into the generated CSS. status-foreground
 * pairs with all six: every fill was picked to hold AA contrast against it,
 * which secondary/muted text is not guaranteed to (see app/index.css).
 */
const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-status-applied text-status-foreground',
  SCREENING: 'bg-status-screening text-status-foreground',
  INTERVIEW: 'bg-status-interview text-status-foreground',
  OFFER: 'bg-status-offer text-status-foreground',
  REJECTED: 'bg-status-rejected text-status-foreground',
  WITHDRAWN: 'bg-status-withdrawn text-status-foreground',
}

export function statusBadgeClassName(status: ApplicationStatus): string {
  return STATUS_BADGE_CLASSES[status]
}
