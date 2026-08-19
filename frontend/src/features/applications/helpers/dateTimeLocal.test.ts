import { describe, expect, it } from 'vitest'
import { toDateTimeLocalValue } from './dateTimeLocal'

/**
 * The expected value is spelled out from the same Date object's own getters
 * rather than a fixed string: a `datetime-local` value is in the machine's
 * local time, which the test cannot know in advance. Building it this way
 * still catches the bugs that matter — a swapped field, a missing +1 on the
 * month, a missing pad — because it is written independently of the function
 * under test, just anchored to whatever timezone the test happens to run in.
 */
function expectedLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

describe('toDateTimeLocalValue', () => {
  it('formats an ISO timestamp as YYYY-MM-DDTHH:mm in local time', () => {
    const iso = '2026-08-20T10:05:00.000Z'
    expect(toDateTimeLocalValue(iso)).toBe(expectedLocalValue(iso))
  })

  it('pads single-digit months, days, hours and minutes', () => {
    const iso = '2026-01-02T03:04:00.000Z'
    expect(toDateTimeLocalValue(iso)).toBe(expectedLocalValue(iso))
  })

  it('keeps two different timestamps distinct', () => {
    const morning = toDateTimeLocalValue('2026-08-20T10:05:00.000Z')
    const evening = toDateTimeLocalValue('2026-08-20T22:30:00.000Z')
    expect(morning).not.toBe(evening)
  })
})
