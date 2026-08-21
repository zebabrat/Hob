import { QUIET_AFTER_DAYS } from '@hob/shared'
import type { ApplicationDto, InterviewDto } from '@hob/shared'

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
 * The nearest interview scheduled within the next 24 hours, if any — what
 * the mockup's "call tomorrow" card accent is built from. Past interviews
 * and ones further out than a day do not count: this is specifically about
 * "something is happening imminently", not the interview list in general.
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
    .filter(({ at }) => at > now.getTime() && at - now.getTime() <= DAY_MS)
    .sort((a, b) => a.at - b.at)

  return soon[0]?.interview ?? null
}

/** "Call today 15:30" / "Call tomorrow 11:00" — same-day vs. next-day framing for upcomingInterview's result. */
export function formatUpcomingInterview(scheduledAt: string, now: Date = new Date()): string {
  const at = new Date(scheduledAt)
  const isSameDay = at.toDateString() === now.toDateString()
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at)
  return `Call ${isSameDay ? 'today' : 'tomorrow'} ${time}`
}
