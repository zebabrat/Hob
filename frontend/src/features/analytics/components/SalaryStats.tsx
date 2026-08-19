import type { SalaryStats as SalaryStatsData } from '@hob/shared'
import { formatSalary } from 'shared/helpers/formatSalary'
import { EmptyState } from './EmptyState'
import { StatTile } from './StatTile'

interface SalaryStatsProps {
  salaryStats: SalaryStatsData
}

export function SalaryStats({ salaryStats }: SalaryStatsProps) {
  if (salaryStats.count === 0) {
    return <EmptyState message="Add a salary to an application to see the range." />
  }

  const avg = salaryStats.avg === null ? null : Math.round(salaryStats.avg)

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Lowest" value={formatSalary(salaryStats.min) ?? '—'} />
      <StatTile label="Average" value={formatSalary(avg) ?? '—'} />
      <StatTile label="Highest" value={formatSalary(salaryStats.max) ?? '—'} />
    </div>
  )
}
