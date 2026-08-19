import type { AnalyticsSummary } from '@hob/shared'
import { Metric } from 'shared/components/Metric'

interface SummaryCardsProps {
  summary: AnalyticsSummary
}

/** The hero's headline numbers — a metrics row divided by hairlines, same shape as the board and detail headers. */
export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="flex flex-wrap gap-6">
      <Metric label="Total applications" value={String(summary.totalApplications)} />
      <Metric label="Active" value={String(summary.activeApplications)} />
      <Metric label="Offers" value={String(summary.offers)} highlight />
      <Metric label="Rejection rate" value={`${Math.round(summary.rejectionRate * 100)}%`} />
    </div>
  )
}
