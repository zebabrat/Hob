import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import type { ApplicationColumn } from '../types'

/**
 * The order columns appear on the board, left to right — this is the path an
 * application takes, with the two ways out at the end. What each one is
 * *called* comes from the shared label map, not a second copy of the text.
 */
const BOARD_STATUS_ORDER: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]

export const BOARD_COLUMNS: { status: ApplicationStatus; title: string }[] =
  BOARD_STATUS_ORDER.map((status) => ({ status, title: statusLabel(status) }))

/** Most recently touched first: a card you just moved is the one you look for. */
function byUpdatedAtDesc(a: ApplicationDto, b: ApplicationDto): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
}

/**
 * Splits the flat list the API returns into one entry per column.
 *
 * Every column is always present, empty ones included — a board that hides
 * "Offer" until something lands there would move the other columns sideways
 * mid-drag.
 */
export function groupByStatus(applications: ApplicationDto[]): ApplicationColumn[] {
  return BOARD_COLUMNS.map(({ status, title }) => ({
    status,
    title,
    applications: applications
      .filter((application) => application.status === status)
      .sort(byUpdatedAtDesc),
  }))
}
