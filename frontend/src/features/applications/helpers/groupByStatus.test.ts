import { describe, expect, it } from 'vitest'
import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { ARCHIVE_COLUMNS, BOARD_COLUMNS, groupByStatus } from './groupByStatus'

function application(
  id: number,
  status: ApplicationStatus,
  updatedAt: string,
): ApplicationDto {
  return {
    id,
    userId: 1,
    company: `Company ${id}`,
    position: 'Backend Engineer',
    recruiter: null,
    priority: 'MEDIUM',
    status,
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
    updatedAt,
    interviews: [],
    attachments: [],
    statusChanges: [],
  }
}

describe('groupByStatus', () => {
  it('returns every board column in order, empty ones included, by default', () => {
    const columns = groupByStatus([])

    expect(columns.map((column) => column.status)).toEqual([
      'APPLIED',
      'SCREENING',
      'INTERVIEW',
      'OFFER',
    ])
    // An empty column still has to be rendered, or the board reflows mid-drag.
    expect(columns.every((column) => column.applications.length === 0)).toBe(true)
  })

  it('puts each application under its own status', () => {
    const columns = groupByStatus([
      application(1, 'APPLIED', '2026-08-01T10:00:00.000Z'),
      application(2, 'OFFER', '2026-08-01T10:00:00.000Z'),
      application(3, 'APPLIED', '2026-08-01T09:00:00.000Z'),
    ])

    const byStatus = Object.fromEntries(
      columns.map((column) => [column.status, column.applications.map((item) => item.id)]),
    )

    expect(byStatus['APPLIED']).toEqual([1, 3])
    expect(byStatus['OFFER']).toEqual([2])
  })

  it('sorts a column with the most recently updated first', () => {
    const columns = groupByStatus([
      application(1, 'INTERVIEW', '2026-08-01T09:00:00.000Z'),
      application(2, 'INTERVIEW', '2026-08-03T09:00:00.000Z'),
      application(3, 'INTERVIEW', '2026-08-02T09:00:00.000Z'),
    ])

    const interview = columns.find((column) => column.status === 'INTERVIEW')
    // A card you just moved carries the newest timestamp, so it shows up at the
    // top of the column it landed in.
    expect(interview?.applications.map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('covers the four statuses a normal application moves through', () => {
    expect(BOARD_COLUMNS).toHaveLength(4)
  })

  it('groups the three archive statuses when passed ARCHIVE_COLUMNS', () => {
    const columns = groupByStatus(
      [
        application(1, 'ACCEPTED', '2026-08-01T09:00:00.000Z'),
        application(2, 'REJECTED', '2026-08-01T09:00:00.000Z'),
        application(3, 'WITHDRAWN', '2026-08-01T09:00:00.000Z'),
      ],
      ARCHIVE_COLUMNS,
    )

    expect(columns.map((column) => column.status)).toEqual(['ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    expect(columns[0]?.applications.map((item) => item.id)).toEqual([1])
    expect(columns[1]?.applications.map((item) => item.id)).toEqual([2])
    expect(columns[2]?.applications.map((item) => item.id)).toEqual([3])
  })
})
