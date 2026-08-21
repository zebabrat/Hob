import { Link } from 'react-router'
import type { ApplicationDto } from '@hob/shared'
import { cn } from 'shared/lib/utils'
import { buildPipelineRows, pipelineColumns } from '../helpers/pipelineTimeline'
import type { PipelineStageVariant } from '../helpers/pipelineTimeline'

interface PipelineViewProps {
  applications: ApplicationDto[]
}

const STAGE_CLASSES: Record<PipelineStageVariant, string> = {
  filled: 'bg-highlight text-white px-2 py-1',
  outline: 'border border-foreground text-foreground px-2 py-1',
  dashed: 'border border-dashed border-text-quaternary text-text-tertiary px-2 py-1',
  quiet: 'border border-dotted border-text-tertiary text-text-tertiary px-2 py-1',
  text: 'text-text-tertiary',
}

/**
 * "Пайплайн по времени" — one row per application, a track from the week it
 * was applied to the week of its last event, instead of a column per status.
 * The point per the mockup: this makes a stalled conversation visible as a
 * short track with nothing after it, which a kanban board's column position
 * alone cannot show.
 */
export function PipelineView({ applications }: PipelineViewProps) {
  const columns = pipelineColumns()
  const rows = buildPipelineRows(applications)

  if (rows.length === 0) {
    return (
      <p className="border-t border-border py-16 text-center font-mono text-xs tracking-[0.08em] text-text-tertiary uppercase">
        No applications yet
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[240px_1fr] border-t border-border">
        <div className="border-r border-border" />
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column, index) => (
            <div
              key={column.weekIndex}
              className={cn(
                'px-3 py-2.5 font-mono text-[0.59375rem] tracking-[0.08em]',
                index < columns.length - 1
                  ? 'border-r border-border-weak text-text-tertiary'
                  : 'text-foreground',
              )}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {rows.map((row) => (
        <div
          key={row.application.id}
          className={cn(
            'grid grid-cols-[240px_1fr] border-t border-border-weak',
            row.dimmed && 'opacity-50',
          )}
        >
          <Link
            to={`/applications/${row.application.id}`}
            className="border-r border-border px-5 py-4 hover:bg-zebra"
          >
            <div className="text-[0.9375rem] font-medium text-foreground">
              {row.application.company}
            </div>
            <div className="mt-1 font-mono text-[0.59375rem] tracking-[0.07em] text-text-tertiary uppercase">
              {row.application.position}
            </div>
          </Link>

          {/*
           * The label sits in its own band above the track rather than
           * inline at the bar's end (as the mockup draws it): a short,
           * late-in-the-window track — common with real, dynamically dated
           * data — puts the bar's end too close to the label's anchor point
           * for an inline placement not to overlap it. Stacking the two
           * bands keeps the label legible regardless of how short or how
           * far right the track is.
           */}
          <div className="relative h-14">
            <span
              className={cn(
                'absolute top-3 font-mono text-[0.5625rem] tracking-[0.07em] whitespace-nowrap uppercase',
                STAGE_CLASSES[row.variant],
              )}
              style={{
                left: `${Math.min(row.rightPercent, 96)}%`,
                transform: row.rightPercent > 75 ? 'translateX(-100%)' : 'translateX(0)',
              }}
            >
              {row.stageLabel}
            </span>
            <div
              className="absolute bottom-4 h-1.5 bg-foreground"
              style={{
                left: `${row.leftPercent}%`,
                width: `${Math.max(row.rightPercent - row.leftPercent, 1)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
