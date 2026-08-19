const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "2026-08" to "Aug 2026" — the over-time chart's x-axis labels. */
export function formatMonthLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${year}`
}
