import { describe, expect, it } from 'vitest'
import { formatWeekLabel, isoWeekNumber } from './isoWeek'

describe('isoWeekNumber', () => {
  it('matches known ISO week numbers', () => {
    // 2026-01-01 is a Thursday, so it falls in ISO week 1 of 2026.
    expect(isoWeekNumber(new Date('2026-01-01T12:00:00.000Z'))).toBe(1)
    // 2025-12-29 is a Monday in the same ISO week as 2026-01-01.
    expect(isoWeekNumber(new Date('2025-12-29T12:00:00.000Z'))).toBe(1)
  })
})

describe('formatWeekLabel', () => {
  it('prefixes the week number with WK', () => {
    expect(formatWeekLabel(new Date('2026-01-01T12:00:00.000Z'))).toBe('WK 1')
  })
})
