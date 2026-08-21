import { describe, expect, it } from 'vitest'
import type { ApplicationDto, InterviewDto } from '@hob/shared'
import { formatUpcomingInterview, isQuiet, quietDays, upcomingInterview } from './cardSignals'

const NOW = new Date('2026-08-19T10:00:00.000Z')

function application(overrides: Partial<ApplicationDto> = {}): ApplicationDto {
  return {
    id: 1,
    userId: 1,
    company: 'Acme',
    position: 'Engineer',
    recruiter: null,
    priority: 'MEDIUM',
    status: 'SCREENING',
    salary: null,
    workFormat: null,
    jobUrl: null,
    source: [],
    salaryType: null,
    offerDeadline: null,
    labels: [],
    summary: null,
    notes: null,
    appliedDate: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    interviews: [],
    attachments: [],
    statusChanges: [],
    ...overrides,
  }
}

function interview(overrides: Partial<InterviewDto> = {}): InterviewDto {
  return {
    id: 1,
    applicationId: 1,
    round: 'Round 1',
    scheduledAt: null,
    notes: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('isQuiet', () => {
  it('is true for an active application untouched for 14+ days', () => {
    expect(isQuiet(application({ updatedAt: '2026-08-01T00:00:00.000Z' }), NOW)).toBe(true)
  })

  it('is false for an active application touched recently', () => {
    expect(isQuiet(application({ updatedAt: '2026-08-18T00:00:00.000Z' }), NOW)).toBe(false)
  })

  it('is never true for a terminal status, no matter how old', () => {
    expect(
      isQuiet(application({ status: 'REJECTED', updatedAt: '2026-01-01T00:00:00.000Z' }), NOW),
    ).toBe(false)
  })
})

describe('quietDays', () => {
  it('counts whole days since the last update', () => {
    expect(quietDays(application({ updatedAt: '2026-08-01T00:00:00.000Z' }), NOW)).toBe(18)
  })
})

describe('upcomingInterview', () => {
  it('returns an interview scheduled within the next 24 hours', () => {
    const soon = interview({ id: 5, scheduledAt: '2026-08-19T20:00:00.000Z' })
    expect(upcomingInterview(application({ interviews: [soon] }), NOW)?.id).toBe(5)
  })

  it('ignores an interview more than 24 hours out', () => {
    const later = interview({ scheduledAt: '2026-08-25T20:00:00.000Z' })
    expect(upcomingInterview(application({ interviews: [later] }), NOW)).toBeNull()
  })

  it('ignores a past interview', () => {
    const past = interview({ scheduledAt: '2026-08-18T20:00:00.000Z' })
    expect(upcomingInterview(application({ interviews: [past] }), NOW)).toBeNull()
  })

  it('picks the nearest one when several are within the window', () => {
    const far = interview({ id: 1, scheduledAt: '2026-08-20T09:00:00.000Z' })
    const near = interview({ id: 2, scheduledAt: '2026-08-19T15:00:00.000Z' })
    expect(upcomingInterview(application({ interviews: [far, near] }), NOW)?.id).toBe(2)
  })
})

/**
 * "today"/"tomorrow" and the HH:mm shown are both in the machine's local
 * time — which the test cannot know in advance — so the expectation is built
 * from the same Date object's own getters rather than a fixed string, same
 * approach as dateTimeLocal.test.ts.
 */
function expectedLabel(iso: string, referenceIso: string): string {
  const at = new Date(iso)
  const reference = new Date(referenceIso)
  const pad = (value: number) => String(value).padStart(2, '0')
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`
  const isSameDay = at.toDateString() === reference.toDateString()
  return `Call ${isSameDay ? 'today' : 'tomorrow'} ${time}`
}

describe('formatUpcomingInterview', () => {
  it('says "today" for a same-day time', () => {
    const iso = '2026-08-19T15:00:00.000Z'
    expect(formatUpcomingInterview(iso, NOW)).toBe(expectedLabel(iso, NOW.toISOString()))
  })

  it('says "tomorrow" for a next-day time', () => {
    const iso = '2026-08-20T11:00:00.000Z'
    expect(formatUpcomingInterview(iso, NOW)).toBe(expectedLabel(iso, NOW.toISOString()))
  })
})
