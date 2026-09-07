import { QUIET_AFTER_DAYS } from '@hob/shared'
import type { ApplicationDto, InterviewDto } from '@hob/shared'
import { formatShortDate } from 'shared/helpers/formatShortDate'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * An application is "quiet" once it has sat untouched past the shared
 * threshold while still active — a terminal one (rejected/withdrawn) is not
 * waiting on anything, so it is never quiet. Drives the board card's dimmed
 * opacity and the analytics "no response" bucket, from the same constant.
 */
export function isQuiet(application: ApplicationDto, now: Date = new Date()): boolean {
  if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') return false
  return now.getTime() - Date.parse(application.updatedAt) >= QUIET_AFTER_DAYS * DAY_MS
}

/** Whole days since the last update — only meaningful when isQuiet is true. */
export function quietDays(application: ApplicationDto, now: Date = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(application.updatedAt)) / DAY_MS)
}

/**
 * The nearest future scheduled interview, if any — what the board card's
 * "Call …" meta tag is built from. Past interviews never count; how far in
 * the future is fine, so a call next week still shows up rather than the
 * card looking untouched until the day before.
 */
export function upcomingInterview(
  application: ApplicationDto,
  now: Date = new Date(),
): InterviewDto | null {
  const soon = application.interviews
    .filter((interview): interview is InterviewDto & { scheduledAt: string } =>
      Boolean(interview.scheduledAt),
    )
    .map((interview) => ({ interview, at: Date.parse(interview.scheduledAt) }))
    .filter(({ at }) => at > now.getTime())
    .sort((a, b) => a.at - b.at)

  return soon[0]?.interview ?? null
}

/**
 * True when upcomingInterview's result is close enough to warrant the
 * card's left accent border — a call tomorrow deserves eye-catching
 * urgency, one next week does not.
 */
export function isImminentInterview(application: ApplicationDto, now: Date = new Date()): boolean {
  const next = upcomingInterview(application, now)
  if (!next?.scheduledAt) return false
  return Date.parse(next.scheduledAt) - now.getTime() <= DAY_MS
}

/** "Call today 15:30" / "Call tomorrow 11:00" for the next day or so, "Call 27 AUG" further out. */
export function formatUpcomingInterview(scheduledAt: string, now: Date = new Date()): string {
  const at = new Date(scheduledAt)
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at)

  if (at.toDateString() === now.toDateString()) return `Call today ${time}`

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (at.toDateString() === tomorrow.toDateString()) return `Call tomorrow ${time}`

  return `Call ${formatShortDate(scheduledAt)}`
}
