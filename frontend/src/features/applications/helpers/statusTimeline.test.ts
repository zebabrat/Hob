import { describe, expect, it } from 'vitest'
import type { ApplicationDto, StatusChangeDto } from '@hob/shared'
import { buildStatusTimeline, daysInProcess } from './statusTimeline'

function change(toStatus: ApplicationDto['status'], changedAt: string): StatusChangeDto {
  return { id: 1, applicationId: 1, fromStatus: null, toStatus, changedAt }
}

function application(overrides: Partial<ApplicationDto> = {}): ApplicationDto {
  return {
    id: 1,
    userId: 1,
    company: 'Acme',
    position: 'Engineer',
    recruiter: null,
    priority: 'MEDIUM',
    status: 'INTERVIEW',
    salary: null,
    workFormat: null,
    jobUrl: null,
    source: [],
    salaryType: null,
    offerDeadline: null,
    labels: [],
    summary: null,
    notes: null,
    appliedDate: '2026-07-04T00:00:00.000Z',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-04T00:00:00.000Z',
    interviews: [],
    attachments: [],
    statusChanges: [],
    ...overrides,
  }
}

describe('buildStatusTimeline', () => {
  it('marks steps before the current status as past, with their real entry dates', () => {
    const app = application({
      status: 'INTERVIEW',
      statusChanges: [
        change('APPLIED', '2026-07-04T00:00:00.000Z'),
        change('SCREENING', '2026-07-18T00:00:00.000Z'),
        change('INTERVIEW', '2026-07-31T00:00:00.000Z'),
      ],
    })

    const { steps, decision } = buildStatusTimeline(app)

    expect(steps.map((step) => [step.status, step.isPast, step.isCurrent, step.enteredAt])).toEqual([
      ['APPLIED', true, false, '2026-07-04T00:00:00.000Z'],
      ['SCREENING', true, false, '2026-07-18T00:00:00.000Z'],
      ['INTERVIEW', false, true, '2026-07-31T00:00:00.000Z'],
      ['OFFER', false, false, null],
    ])
    expect(decision).toEqual({ reached: false, status: null, enteredAt: null })
  })

  it('treats a terminal status as having passed through every step it has a real date for', () => {
    const app = application({
      status: 'REJECTED',
      statusChanges: [
        change('APPLIED', '2026-07-04T00:00:00.000Z'),
        change('SCREENING', '2026-07-18T00:00:00.000Z'),
        change('REJECTED', '2026-07-25T00:00:00.000Z'),
      ],
    })

    const { steps, decision } = buildStatusTimeline(app)

    expect(steps.map((step) => step.isPast)).toEqual([true, true, false, false])
    expect(steps.every((step) => !step.isCurrent)).toBe(true)
    expect(decision).toEqual({ reached: true, status: 'REJECTED', enteredAt: '2026-07-25T00:00:00.000Z' })
  })
})

describe('daysInProcess', () => {
  it('counts from appliedDate to now for an open application', () => {
    const app = application({ appliedDate: '2026-08-01T00:00:00.000Z', status: 'INTERVIEW' })
    expect(daysInProcess(app, new Date('2026-08-11T00:00:00.000Z'))).toBe(10)
  })

  it('counts from appliedDate to the terminal transition once resolved', () => {
    const app = application({
      appliedDate: '2026-07-04T00:00:00.000Z',
      status: 'ACCEPTED',
      statusChanges: [change('ACCEPTED', '2026-08-19T00:00:00.000Z')],
    })
    // A much later "now" must not count — the application already resolved.
    expect(daysInProcess(app, new Date('2027-01-01T00:00:00.000Z'))).toBe(46)
  })
})
