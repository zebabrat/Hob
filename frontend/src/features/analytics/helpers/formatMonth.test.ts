import { describe, expect, it } from 'vitest'
import { formatMonthLabel } from './formatMonth'

describe('formatMonthLabel', () => {
  it('names the month', () => {
    expect(formatMonthLabel('2026-08')).toBe('Aug 2026')
  })

  it('handles the turn of the year', () => {
    expect(formatMonthLabel('2027-01')).toBe('Jan 2027')
    expect(formatMonthLabel('2026-12')).toBe('Dec 2026')
  })
})
