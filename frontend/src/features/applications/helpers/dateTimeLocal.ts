/**
 * An ISO timestamp to the value a `datetime-local` input expects
 * ("YYYY-MM-DDTHH:mm"), in the browser's own timezone — that input has no
 * timezone of its own, so its value has to already be in local time or the
 * displayed hour would not match what was scheduled.
 */
export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
