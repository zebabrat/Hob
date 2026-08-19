import { FormError } from 'shared/components/FormError'
import { useAnalytics } from '../hooks/useAnalytics'
import { ActivityOverTimeChart } from './ActivityOverTimeChart'
import { EmptyState } from './EmptyState'
import { FunnelChart } from './FunnelChart'
import { SalaryStats } from './SalaryStats'
import { StageDurationChart } from './StageDurationChart'
import { SummaryCards } from './SummaryCards'
import { WorkFormatChart } from './WorkFormatChart'

export function AnalyticsDashboard() {
  const { data, isLoading, error } = useAnalytics()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl tracking-[-0.03em] text-foreground">What's working</h1>
          <p className="mt-2 text-text-secondary">Where applications move forward, and where they stall.</p>
        </div>

        {!isLoading && !error && data && data.summary.totalApplications > 0 && (
          <SummaryCards summary={data.summary} />
        )}
      </header>

      {isLoading && <p className="text-sm text-text-secondary">Loading…</p>}

      {!isLoading && error && <FormError message={error} />}

      {!isLoading && !error && data && (
        <>
          {data.summary.totalApplications === 0 ? (
            <EmptyState message="Add a few applications to see analytics." />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <FunnelChart funnel={data.funnel} />
                <ActivityOverTimeChart overTime={data.overTime} />
                <StageDurationChart avgTimePerStage={data.avgTimePerStage} />
                <WorkFormatChart
                  byWorkFormat={data.byWorkFormat}
                  workFormatUnspecified={data.workFormatUnspecified}
                />
              </div>

              <section>
                <h2 className="mb-3 font-mono text-xs tracking-[0.08em] text-text-secondary uppercase">
                  Salary range
                </h2>
                <SalaryStats salaryStats={data.salaryStats} />
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
