/**
 * "12 AUG" — the compact, uppercase form the mockup's mono meta rows use
 * for dates (kanban card, interview list). Shared rather than duplicated
 * per call site since both want exactly this format.
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' })
    .format(date)
    .toUpperCase()
}
