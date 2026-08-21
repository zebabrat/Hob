import type { StageTransitionEntry } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import { formatDays } from '../helpers/formatDays'
import { EmptyState } from './EmptyState'

interface StageTransitionsTableProps {
  stageTransitions: StageTransitionEntry[]
}

/**
 * "Время между этапами (медиана)" — one bar per real forward transition
 * (see TRACKED_TRANSITIONS on the backend), bar width relative to the
 * slowest step so the longest wait is visually obvious. A transition
 * nothing has gone through yet is left out of the bars entirely rather than
 * drawn as zero-length, which would read as "instant".
 */
export function StageTransitionsTable({ stageTransitions }: StageTransitionsTableProps) {
  const withData = stageTransitions.filter(
    (entry): entry is StageTransitionEntry & { medianDays: number } => entry.medianDays !== null,
  )
  const maxDays = Math.max(...withData.map((entry) => entry.medianDays), 1)
  const slowest = withData.reduce<(typeof withData)[number] | null>(
    (current, entry) => (current === null || entry.medianDays > current.medianDays ? entry : current),
    null,
  )

  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Time between stages (median)
      </h2>
      {withData.length === 0 ? (
        <EmptyState message="Move an application to a new stage to see how long each step takes." />
      ) : (
        <>
          <div className="flex flex-col">
            {withData.map((entry) => (
              <div
                key={`${entry.from}-${entry.to}`}
                className="grid grid-cols-[10rem_1fr_3.75rem] items-center gap-4.5 border-t border-border-weak py-2.5 first:border-t-0"
              >
                <span className="text-[0.8125rem] text-foreground">
                  {statusLabel(entry.from)} → {statusLabel(entry.to)}
                </span>
                <div className="h-[1.375rem] bg-background">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${(entry.medianDays / maxDays) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono text-[0.6875rem] text-foreground">
                  {formatDays(entry.medianDays)}
                </span>
              </div>
            ))}
          </div>
          {slowest && (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-text-secondary">
              Slowest step is {statusLabel(slowest.from)} → {statusLabel(slowest.to)}, at{' '}
              {formatDays(slowest.medianDays)} median.
            </p>
          )}
        </>
      )}
    </section>
  )
}
