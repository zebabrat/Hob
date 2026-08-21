const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** ISO-8601 week number (1–53) — the week containing the given date, per the standard "Thursday decides the year" rule. */
export function isoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Thursday of the same ISO week — the week's number is whatever year that Thursday falls in.
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7))
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / WEEK_MS)
}

/** "WK 34" — the compact mono label the board's pipeline view and analytics' weekly chart both use for a week-start date. */
export function formatWeekLabel(date: Date): string {
  return `WK ${isoWeekNumber(date)}`
}
