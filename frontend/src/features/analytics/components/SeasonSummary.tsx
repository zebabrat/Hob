import { EmptyState } from './EmptyState'

interface SeasonSummaryProps {
  seasonSummary: string[]
}

/**
 * "Итог сезона" — plain-language takeaways, computed server-side from the
 * same numbers the rest of the page shows (see buildSeasonSummary in
 * analytics.ts) — never a canned line, and empty rather than guessing once
 * there are too few applications for a % to mean anything.
 */
export function SeasonSummary({ seasonSummary }: SeasonSummaryProps) {
  return (
    <section>
      <h2 className="mb-5 font-mono text-[0.65625rem] tracking-[0.1em] text-text-tertiary uppercase">
        Season summary
      </h2>
      {seasonSummary.length === 0 ? (
        <EmptyState message="A few more applications will unlock takeaways here." />
      ) : (
        <div className="flex flex-col">
          {seasonSummary.map((insight, index) => (
            <p
              key={index}
              className="border-t border-border-weak py-3.5 text-sm leading-relaxed text-foreground first:border-t-0"
            >
              {insight}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
