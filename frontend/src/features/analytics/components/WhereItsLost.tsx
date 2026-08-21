import type { LostBreakdown } from '@hob/shared'
import { QUIET_AFTER_DAYS } from '@hob/shared'
import { EmptyState } from './EmptyState'

interface WhereItsLostProps {
  lost: LostBreakdown
}

const ROWS: { key: keyof LostBreakdown; label: string }[] = [
  { key: 'noResponse', label: `No response ${QUIET_AFTER_DAYS}+ days` },
  { key: 'rejectedBeforeInterview', label: 'Rejected before an interview' },
  { key: 'rejectedAfterInterview', label: 'Rejected after an interview' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

/**
 * "Где теряется" — every count here comes straight from status and whether
 * an interview was ever recorded (see the analytics.ts comment on
 * lostBreakdownSchema); nothing invents a reason the data does not actually
 * carry.
 */
export function WhereItsLost({ lost }: WhereItsLostProps) {
  const total = ROWS.reduce((sum, row) => sum + lost[row.key], 0)
  const noResponseShare = total === 0 ? 0 : Math.round((lost.noResponse / total) * 100)

  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Where it's lost
      </h2>
      {total === 0 ? (
        <EmptyState message="No lost applications yet." />
      ) : (
        <>
          <div className="flex flex-col">
            {ROWS.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between border-t border-border-weak py-2.5 first:border-t-0"
              >
                <span className="text-[0.84375rem] text-text-secondary">{row.label}</span>
                <span className="font-mono text-xs text-foreground">{lost[row.key]}</span>
              </div>
            ))}
          </div>
          {lost.noResponse > 0 && (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-text-secondary">
              {noResponseShare}% of lost applications ({lost.noResponse} of {total}) went quiet with no
              response at all.
            </p>
          )}
        </>
      )}
    </section>
  )
}
