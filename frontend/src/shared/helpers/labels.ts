import type { ApplicationStatus, Priority, SalaryType, WorkFormat } from '@hob/shared'

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
  ACCEPTED: 'Accepted',
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

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  GROSS: 'Gross',
  NET: 'Net',
}

export function salaryTypeLabel(salaryType: SalaryType | null): string | null {
  return salaryType ? SALARY_TYPE_LABELS[salaryType] : null
}

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export function priorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority]
}

/**
 * The kanban card's company name takes the priority color directly — no
 * separate badge or stripe, the one line every card already leads with just
 * shifts weight. MEDIUM keeps the ordinary heading color (it's the default,
 * nothing to call out); LOW recedes to a muted tone; HIGH takes the app's
 * one accent, same color the "Offer" status and other single-thing-to-notice
 * moments already use. A literal lookup, not a templated class, for the same
 * Tailwind-scanner reason as STATUS_BADGE_CLASSES below.
 */
const PRIORITY_COMPANY_CLASSES: Record<Priority, string> = {
  LOW: 'text-text-tertiary',
  MEDIUM: 'text-foreground',
  HIGH: 'text-highlight-text',
}

export function priorityCompanyClassName(priority: Priority): string {
  return PRIORITY_COMPANY_CLASSES[priority]
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
  ACCEPTED: 'bg-status-offer text-status-foreground',
  REJECTED: 'bg-status-rejected text-status-foreground',
  WITHDRAWN: 'bg-status-withdrawn text-status-foreground',
}

export function statusBadgeClassName(status: ApplicationStatus): string {
  return STATUS_BADGE_CLASSES[status]
}
