import type { AnalyticsSummary } from '@hob/shared'
import { cn } from 'shared/lib/utils'

interface AnalyticsHeroMetricsProps {
  summary: AnalyticsSummary
}

function HeroMetric({
  value,
  suffix,
  label,
  highlight,
}: {
  value: string
  suffix?: string
  label: string
  highlight?: boolean
}) {
  return (
    <div className="border-r border-border-weak px-7 py-6.5 last:border-r-0">
      <div
        className={cn(
          'text-[3.25rem] leading-[0.9] tracking-[-0.04em]',
          highlight ? 'text-highlight' : 'text-foreground',
        )}
      >
        {value}
        {suffix && <span className="text-[1.625rem] text-text-tertiary">{suffix}</span>}
      </div>
      <div className="mt-3 font-mono text-[0.59375rem] tracking-[0.09em] text-text-tertiary uppercase">
        {label}
      </div>
    </div>
  )
}

/** The four big numbers directly under the hero, framed by hairlines above and below — per the mockup's "верхние метрики" grid, not the smaller Metric component the board/detail headers use. */
export function AnalyticsHeroMetrics({ summary }: AnalyticsHeroMetricsProps) {
  const pctReachedInterview =
    summary.totalApplications === 0
      ? 0
      : Math.round((summary.reachedInterview / summary.totalApplications) * 100)

  return (
    <div className="grid grid-cols-2 border-t border-b border-border sm:grid-cols-4">
      <HeroMetric value={String(summary.totalApplications)} label="Total sent" />
      <HeroMetric value={String(pctReachedInterview)} suffix="%" label="Reached interview" />
      <HeroMetric
        value={summary.medianDaysToFirstResponse === null ? '—' : String(Math.round(summary.medianDaysToFirstResponse))}
        suffix={summary.medianDaysToFirstResponse === null ? undefined : ' d'}
        label="Median days to response"
      />
      <HeroMetric value={String(summary.offers)} label="Offers this period" highlight />
    </div>
  )
}
