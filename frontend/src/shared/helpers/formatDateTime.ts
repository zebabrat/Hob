/**
 * "19 AUG, 12:04" — the board hero's "last touched" timestamp. Uppercase to
 * match every other mono meta string in the app (see formatShortDate).
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' })
    .format(date)
    .toUpperCase()
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${day}, ${time}`
}
