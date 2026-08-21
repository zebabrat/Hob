import { useState } from 'react'
import type { AnalyticsPeriod } from '@hob/shared'
import { FormError } from 'shared/components/FormError'
import { useAnalytics } from '../hooks/useAnalytics'
import { AnalyticsHeroMetrics } from './AnalyticsHeroMetrics'
import { AnalyticsSkeleton } from './AnalyticsSkeleton'
import { BreakdownTable } from './BreakdownTable'
import { EmptyState } from './EmptyState'
import { FunnelChart } from './FunnelChart'
import { PeriodToggle } from './PeriodToggle'
import { ResponseTimeHistogram } from './ResponseTimeHistogram'
import { SalaryStats } from './SalaryStats'
import { SeasonSummary } from './SeasonSummary'
import { StageTransitionsTable } from './StageTransitionsTable'
import { WeeklyActivityChart } from './WeeklyActivityChart'
import { WhereItsLost } from './WhereItsLost'
import { WorkFormatChart } from './WorkFormatChart'

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('all')
  const { data, isLoading, error } = useAnalytics(period)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl tracking-[-0.03em] text-foreground">What's working</h1>
          <p className="mt-3 max-w-lg text-sm text-text-secondary">
            {data && data.seasonSummary.length > 0
              ? data.seasonSummary[0]
              : 'Where applications move forward, and where they stall.'}
          </p>
        </div>
        <PeriodToggle period={period} onChange={setPeriod} />
      </header>

      {isLoading && <AnalyticsSkeleton />}

      {!isLoading && error && <FormError message={error} />}

      {!isLoading && !error && data && (
        <>
          {data.summary.totalApplications === 0 ? (
            <EmptyState message="Add a few applications to see analytics." />
          ) : (
            <div className="flex flex-col gap-10">
              <AnalyticsHeroMetrics summary={data.summary} />

              <div className="grid grid-cols-1 border-t border-border lg:grid-cols-[1fr_420px]">
                <div className="flex flex-col gap-9 py-8 lg:border-r lg:border-border lg:pr-9">
                  <FunnelChart funnel={data.funnel} />
                  <WeeklyActivityChart overTime={data.overTime} />
                </div>
                <div className="flex flex-col gap-9 py-8 lg:pl-9">
                  <BreakdownTable
                    title="By source"
                    columnLabel="Source"
                    rows={data.bySource.map((entry) => ({ name: entry.source, ...entry }))}
                    emptyMessage="Add a source to a few applications to see this."
                  />
                  <WhereItsLost lost={data.lost} />
                </div>
              </div>

              <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2">
                <div className="flex flex-col gap-9 py-8 lg:border-r lg:border-border lg:pr-9">
                  <StageTransitionsTable stageTransitions={data.stageTransitions} />
                  <BreakdownTable
                    title="By role"
                    columnLabel="Role"
                    rows={data.byRole.map((entry) => ({ name: entry.role, ...entry }))}
                    emptyMessage="Add a few applications to see conversion by role."
                  />
                </div>
                <div className="flex flex-col gap-9 py-8 lg:pl-9">
                  <ResponseTimeHistogram responseTimeDistribution={data.responseTimeDistribution} />
                  <SeasonSummary seasonSummary={data.seasonSummary} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-border pt-8 lg:grid-cols-2">
                <section>
                  <h2 className="mb-3 font-mono text-xs tracking-[0.08em] text-text-secondary uppercase">
                    Salary range
                  </h2>
                  <SalaryStats salaryStats={data.salaryStats} />
                </section>
                <WorkFormatChart
                  byWorkFormat={data.byWorkFormat}
                  workFormatUnspecified={data.workFormatUnspecified}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
