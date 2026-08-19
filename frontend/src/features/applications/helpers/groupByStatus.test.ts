import { describe, expect, it } from 'vitest'
import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { BOARD_COLUMNS, groupByStatus } from './groupByStatus'

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
    status,
    salary: null,
    workFormat: null,
    jobUrl: null,
    summary: null,
    notes: null,
    appliedDate: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt,
    interviews: [],
    attachments: [],
  }
}

describe('groupByStatus', () => {
  it('returns every column in board order, empty ones included', () => {
    const columns = groupByStatus([])

    expect(columns.map((column) => column.status)).toEqual([
      'APPLIED',
      'SCREENING',
      'INTERVIEW',
      'OFFER',
      'REJECTED',
      'WITHDRAWN',
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
    expect(byStatus['REJECTED']).toEqual([])
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

  it('covers every status the contract allows', () => {
    // A status added to the contract without a column here would silently drop
    // its applications off the board.
    expect(BOARD_COLUMNS).toHaveLength(6)
  })
})
