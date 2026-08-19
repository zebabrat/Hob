import { describe, expect, it } from 'vitest'
import { formatSalary } from './formatSalary'

describe('formatSalary', () => {
  it('groups thousands with a space', () => {
    expect(formatSalary(180_000)).toBe('180 000')
    expect(formatSalary(1_250_000)).toBe('1 250 000')
  })

  it('leaves numbers below a thousand alone', () => {
    expect(formatSalary(0)).toBe('0')
    expect(formatSalary(999)).toBe('999')
  })

  it('passes null through so the card can leave the line out', () => {
    expect(formatSalary(null)).toBeNull()
  })
})
