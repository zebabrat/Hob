import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import type { ApplicationColumn } from '../types'

/**
 * The path a normal application takes, left to right on the board. Rejected
 * and Withdrawn are not a fifth and sixth rung on this same ladder — they are
 * off-ramps, reachable from any of the four, and live in the Archive tab
 * instead of taking up board width per the mockup's "Отклонённые уходят в
 * архив автоматически".
 */
export const BOARD_STATUS_ORDER: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
]

/** The three ways off the active board, shown on the Archive page instead. */
export const ARCHIVE_STATUS_ORDER: ApplicationStatus[] = ['ACCEPTED', 'REJECTED', 'WITHDRAWN']

function toColumns(statuses: ApplicationStatus[]): { status: ApplicationStatus; title: string }[] {
  return statuses.map((status) => ({ status, title: statusLabel(status) }))
}

export const BOARD_COLUMNS = toColumns(BOARD_STATUS_ORDER)
export const ARCHIVE_COLUMNS = toColumns(ARCHIVE_STATUS_ORDER)

/** Most recently touched first: a card you just moved is the one you look for. */
function byUpdatedAtDesc(a: ApplicationDto, b: ApplicationDto): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
}

/**
 * Splits a flat application list into one entry per column.
 *
 * Every column in `columns` is always present, empty ones included — a board
 * that hides "Offer" until something lands there would move the other
 * columns sideways mid-drag. Defaults to the board's four columns; the
 * Archive page passes ARCHIVE_COLUMNS instead.
 */
export function groupByStatus(
  applications: ApplicationDto[],
  columns: { status: ApplicationStatus; title: string }[] = BOARD_COLUMNS,
): ApplicationColumn[] {
  return columns.map(({ status, title }) => ({
    status,
    title,
    applications: applications
      .filter((application) => application.status === status)
      .sort(byUpdatedAtDesc),
  }))
}
