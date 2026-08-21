import type { SalaryStats as SalaryStatsData } from '@hob/shared'
import { DEFAULT_CURRENCY_SYMBOL, formatSalary } from 'shared/helpers/formatSalary'
import { EmptyState } from './EmptyState'
import { StatTile } from './StatTile'

interface SalaryStatsProps {
  salaryStats: SalaryStatsData
}

function withCurrency(value: number | null): string {
  const formatted = formatSalary(value)
  return formatted ? `${DEFAULT_CURRENCY_SYMBOL}${formatted}` : '—'
}

export function SalaryStats({ salaryStats }: SalaryStatsProps) {
  if (salaryStats.count === 0) {
    return <EmptyState message="Add a salary to an application to see the range." />
  }

  const avg = salaryStats.avg === null ? null : Math.round(salaryStats.avg)

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Lowest" value={withCurrency(salaryStats.min)} />
      <StatTile label="Average" value={withCurrency(avg)} />
      <StatTile label="Highest" value={withCurrency(salaryStats.max)} />
    </div>
  )
}
