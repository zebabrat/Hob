import type { OverTimeEntry } from '@hob/shared'
import { formatWeekLabel } from 'shared/helpers/isoWeek'
import { EmptyState } from './EmptyState'

interface WeeklyActivityChartProps {
  overTime: OverTimeEntry[]
}

/**
 * "Отправлено по неделям" — the user's own search activity, not applicant
 * outcomes: a slow week here means fewer applications went out, worth
 * seeing on its own rather than folded into the funnel. Plain bars per the
 * mockup, not a chart-library axis: the busiest week(s) get the app's dark
 * ink, the most recent week gets the accent (it is "now", regardless of
 * its height), everything else sits at the weak-border tint.
 */
export function WeeklyActivityChart({ overTime }: WeeklyActivityChartProps) {
  if (overTime.length === 0) {
    return (
      <section>
        <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
          Sent per week
        </h2>
        <EmptyState message="Applications will show up here by the week you applied." />
      </section>
    )
  }

  const max = Math.max(...overTime.map((entry) => entry.count), 1)
  const lastIndex = overTime.length - 1

  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Sent per week
      </h2>
      <div className="flex h-32 items-end gap-2.25 border-b border-border">
        {overTime.map((entry, index) => {
          const isPeak = entry.count === max && max > 0
          const isCurrent = index === lastIndex
          return (
            <div
              key={entry.period}
              className={
                isCurrent ? 'flex-1 bg-highlight' : isPeak ? 'flex-1 bg-foreground' : 'flex-1 bg-border'
              }
              style={{ height: `${max === 0 ? 0 : (entry.count / max) * 100}%` }}
              title={`${formatWeekLabel(new Date(entry.period))}: ${entry.count}`}
            />
          )
        })}
      </div>
      <div className="mt-2.5 flex justify-between">
        <span className="font-mono text-[0.59375rem] tracking-[0.06em] text-text-tertiary uppercase">
          {formatWeekLabel(new Date(overTime[0]?.period ?? overTime[0]!.period))}
        </span>
        <span className="font-mono text-[0.59375rem] tracking-[0.06em] text-text-tertiary uppercase">
          {formatWeekLabel(new Date(overTime[lastIndex]?.period ?? overTime[lastIndex]!.period))}
        </span>
      </div>
    </section>
  )
}
