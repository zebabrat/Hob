import type { FunnelEntry } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import { EmptyState } from './EmptyState'

interface FunnelChartProps {
  funnel: FunnelEntry[]
}

/**
 * Where applications sit right now, one bar per status in pipeline order —
 * plain divs, not a chart library, matching the mockup's own hand-built
 * track-and-fill rows exactly (no axis, no gridlines, just the bar). Every
 * percent is of the total sent, not of the previous stage: the point is
 * seeing where the drop-off is biggest against the same baseline every bar
 * shares. Offer gets the app's one accent, same as everywhere else a stage
 * is called out.
 */
export function FunnelChart({ funnel }: FunnelChartProps) {
  const total = funnel.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <section>
      <h2 className="mb-6 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Funnel
      </h2>
      {total === 0 ? (
        <EmptyState message="Add a few applications to see the funnel." />
      ) : (
        <div>
          {funnel.map((entry) => {
            const isOffer = entry.status === 'OFFER'
            const pct = total === 0 ? 0 : Math.round((entry.count / total) * 100)
            return (
              <div
                key={entry.status}
                className="grid grid-cols-[7.5rem_1fr_6rem] items-center gap-4.5 border-t border-border-weak py-2.75"
              >
                <span
                  className={
                    isOffer
                      ? 'font-mono text-[0.65625rem] tracking-[0.07em] text-highlight-text uppercase'
                      : 'font-mono text-[0.65625rem] tracking-[0.07em] text-foreground uppercase'
                  }
                >
                  {statusLabel(entry.status)}
                </span>
                <div className="h-6.5 bg-background">
                  <div
                    className={isOffer ? 'h-full bg-highlight' : 'h-full bg-foreground'}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className={
                    isOffer
                      ? 'text-right font-mono text-[0.6875rem] text-highlight-text'
                      : 'text-right font-mono text-[0.6875rem] text-foreground'
                  }
                >
                  {entry.count} · {pct}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
