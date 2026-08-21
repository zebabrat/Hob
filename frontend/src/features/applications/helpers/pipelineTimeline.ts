import type { ApplicationDto, ApplicationStatus } from '@hob/shared'
import { formatWeekLabel } from 'shared/helpers/isoWeek'
import { statusLabel } from 'shared/helpers/labels'
import { isQuiet } from './cardSignals'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WINDOW_WEEKS = 6

/** Continuous week index since the Unix epoch — for positioning math, where crossing a year boundary must not wrap. */
function weekIndex(iso: string): number {
  return Math.floor(Date.parse(iso) / WEEK_MS)
}

export interface PipelineColumn {
  weekIndex: number
  label: string
}

/**
 * The six week columns the timeline spans, oldest first, ending on the week
 * `now` falls in. `weekIndex` (used for the track positioning math) counts
 * continuous 7-day buckets since the Unix epoch — a Thursday, not a Monday —
 * so it does not line up with real ISO week boundaries; only the *label*
 * needs that alignment, which is why it is computed straight from `now`
 * minus whole weeks rather than by converting a bucket index back to a date.
 */
export function pipelineColumns(now: Date = new Date()): PipelineColumn[] {
  const currentWeek = weekIndex(now.toISOString())
  return Array.from({ length: WINDOW_WEEKS }, (_, index) => {
    const offset = WINDOW_WEEKS - 1 - index
    const labelDate = new Date(now.getTime() - offset * WEEK_MS)
    return { weekIndex: currentWeek - offset, label: formatWeekLabel(labelDate) }
  })
}

export type PipelineStageVariant = 'filled' | 'outline' | 'dashed' | 'quiet' | 'text'

export interface PipelineRow {
  application: ApplicationDto
  /** 0–100, the track's left edge — clamped into the visible window. */
  leftPercent: number
  /** 0–100, the track's right edge. */
  rightPercent: number
  stageLabel: string
  variant: PipelineStageVariant
  /** Terminal outcomes (accepted/rejected/withdrawn) render the whole row at reduced opacity. */
  dimmed: boolean
}

const TERMINAL: ApplicationStatus[] = ['ACCEPTED', 'REJECTED', 'WITHDRAWN']

function stageFor(application: ApplicationDto, now: Date): { label: string; variant: PipelineStageVariant } {
  if (application.status === 'OFFER') return { label: 'Offer', variant: 'filled' }
  if (TERMINAL.includes(application.status)) {
    return { label: statusLabel(application.status), variant: 'text' }
  }
  if (isQuiet(application, now)) return { label: 'Quiet', variant: 'quiet' }
  if (application.status === 'APPLIED') return { label: 'Applied', variant: 'dashed' }
  return { label: statusLabel(application.status), variant: 'outline' }
}

/** The most recent thing known to have happened — updatedAt already moves on every status change and every edit. */
function lastEventAt(application: ApplicationDto): string {
  return application.updatedAt
}

/**
 * One row per application: a track spanning from the week it was applied to
 * the week of its last event, with a stage label at the end. Sorted by last
 * event, most recent first — the mockup's "сортировка по последнему
 * событию" — so a conversation that just moved sits at the top.
 */
export function buildPipelineRows(applications: ApplicationDto[], now: Date = new Date()): PipelineRow[] {
  const columns = pipelineColumns(now)
  const windowStart = columns[0]?.weekIndex ?? 0
  const windowEnd = (columns[columns.length - 1]?.weekIndex ?? 0) + 1
  const span = windowEnd - windowStart

  const toPercent = (iso: string) => {
    const clamped = Math.min(Math.max(weekIndex(iso), windowStart), windowEnd)
    return ((clamped - windowStart) / span) * 100
  }

  return [...applications]
    .sort((a, b) => Date.parse(lastEventAt(b)) - Date.parse(lastEventAt(a)))
    .map((application) => {
      const left = toPercent(application.appliedDate)
      // A track needs visible width even when applied and last-touched land
      // in the same week — otherwise a same-week application draws nothing.
      const right = Math.max(toPercent(lastEventAt(application)), left + 100 / span / 2)
      const { label, variant } = stageFor(application, now)

      return {
        application,
        leftPercent: left,
        rightPercent: Math.min(right, 100),
        stageLabel: label,
        variant,
        dimmed: TERMINAL.includes(application.status),
      }
    })
}
