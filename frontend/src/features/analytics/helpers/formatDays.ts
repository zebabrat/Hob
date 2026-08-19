/** 0.2 -> "< 1 day", 3.46 -> "3.5 days" — avgDays rounded to one decimal for display. */
export function formatDays(days: number): string {
  if (days < 1) return '< 1 day'
  const rounded = Math.round(days * 10) / 10
  return `${rounded} ${rounded === 1 ? 'day' : 'days'}`
}
