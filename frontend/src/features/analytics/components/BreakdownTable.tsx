import { EmptyState } from './EmptyState'

export interface BreakdownRow {
  name: string
  sent: number
  interviewed: number
  conversionRate: number
}

interface BreakdownTableProps {
  title: string
  /** The left column's header — "Source" or "Role", whatever `rows[].name` actually holds. */
  columnLabel: string
  rows: BreakdownRow[]
  emptyMessage: string
}

/**
 * The shape "По источникам" and "По ролям" share exactly — a plain table
 * rather than a chart, since three numbers per row read better as text than
 * as bars this narrow. High conversion (≥50%) gets the app's one accent,
 * matching the mockup's "конверсия акцентным при высоком значении" — the
 * same "call out one number" rule the board and detail metrics follow.
 */
export function BreakdownTable({ title, columnLabel, rows, emptyMessage }: BreakdownTableProps) {
  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        {title}
      </h2>
      {rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_3rem_3rem_3.5rem] gap-2.5 border-b-2 border-foreground pb-2">
            <span className="font-mono text-[0.5625rem] tracking-[0.08em] text-text-tertiary uppercase">
              {columnLabel}
            </span>
            <span className="text-right font-mono text-[0.5625rem] tracking-[0.08em] text-text-tertiary uppercase">
              Sent
            </span>
            <span className="text-right font-mono text-[0.5625rem] tracking-[0.08em] text-text-tertiary uppercase">
              Int.
            </span>
            <span className="text-right font-mono text-[0.5625rem] tracking-[0.08em] text-text-tertiary uppercase">
              Conv.
            </span>
          </div>
          {rows.map((row) => {
            const conversion = Math.round(row.conversionRate * 100)
            return (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_3rem_3rem_3.5rem] gap-2.5 border-b border-border-weak py-3"
              >
                <span className="truncate text-sm text-foreground">{row.name}</span>
                <span className="text-right font-mono text-xs text-text-secondary">{row.sent}</span>
                <span className="text-right font-mono text-xs text-text-secondary">{row.interviewed}</span>
                <span
                  className={
                    conversion >= 50
                      ? 'text-right font-mono text-xs text-highlight-text'
                      : 'text-right font-mono text-xs text-foreground'
                  }
                >
                  {conversion}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
