import { describe, expect, it } from 'vitest'
import type { ApplicationDto } from '@hob/shared'
import { formatWeekLabel } from 'shared/helpers/isoWeek'
import { buildPipelineRows, pipelineColumns } from './pipelineTimeline'

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

describe('pipelineColumns', () => {
  it('returns six columns ending on the current week', () => {
    const columns = pipelineColumns(new Date('2026-08-19T12:00:00.000Z'))
    expect(columns).toHaveLength(6)
    expect(columns[5]?.label).toBe(formatWeekLabel(new Date('2026-08-19T12:00:00.000Z')))
  })
})

describe('buildPipelineRows', () => {
  const now = new Date('2026-08-19T12:00:00.000Z')

  it('sorts by most recent last event first', () => {
    const older = application({ id: 1, updatedAt: '2026-08-10T00:00:00.000Z' })
    const newer = application({ id: 2, updatedAt: '2026-08-18T00:00:00.000Z' })

    const rows = buildPipelineRows([older, newer], now)

    expect(rows.map((row) => row.application.id)).toEqual([2, 1])
  })

  it('clamps a track into the visible window and keeps left <= right', () => {
    const veryOld = application({
      appliedDate: '2020-01-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
    })

    const [row] = buildPipelineRows([veryOld], now)

    expect(row?.leftPercent).toBeGreaterThanOrEqual(0)
    expect(row?.rightPercent).toBeLessThanOrEqual(100)
    expect(row?.leftPercent).toBeLessThanOrEqual(row?.rightPercent ?? 0)
  })

  it('marks a terminal status as dimmed with a plain text label', () => {
    const rejected = application({ status: 'REJECTED' })
    const [row] = buildPipelineRows([rejected], now)

    expect(row?.dimmed).toBe(true)
    expect(row?.variant).toBe('text')
    expect(row?.stageLabel).toBe('Rejected')
  })

  it('marks an offer as the filled variant', () => {
    const offer = application({ status: 'OFFER' })
    const [row] = buildPipelineRows([offer], now)

    expect(row?.variant).toBe('filled')
    expect(row?.dimmed).toBe(false)
  })
})
