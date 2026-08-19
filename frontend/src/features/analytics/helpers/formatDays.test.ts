import { describe, expect, it } from 'vitest'
import { formatDays } from './formatDays'

describe('formatDays', () => {
  it('rounds to one decimal', () => {
    expect(formatDays(3.46)).toBe('3.5 days')
  })

  it('calls anything under a day "< 1 day" rather than "0 days"', () => {
    expect(formatDays(0.2)).toBe('< 1 day')
  })

  it('keeps "day" singular for exactly one', () => {
    expect(formatDays(1)).toBe('1 day')
  })
})
