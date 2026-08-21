import type { AnalyticsPeriod } from '@hob/shared'
import { cn } from 'shared/lib/utils'

interface PeriodToggleProps {
  period: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
}

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

/** Re-scopes every section on the page at once — see useAnalytics. */
export function PeriodToggle({ period, onChange }: PeriodToggleProps) {
  return (
    <div className="flex gap-2.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'border px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.08em] uppercase',
            period === option.value
              ? 'border-foreground text-foreground'
              : 'border-border text-text-secondary',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
