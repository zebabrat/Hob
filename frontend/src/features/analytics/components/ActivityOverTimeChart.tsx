import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { OverTimeEntry } from '@hob/shared'
import { formatMonthLabel } from '../helpers/formatMonth'
import { TOOLTIP_STYLE } from '../helpers/tooltipStyle'
import type { ChartDatum } from '../types'
import { ChartCard } from './ChartCard'
import { EmptyState } from './EmptyState'

interface ActivityOverTimeChartProps {
  overTime: OverTimeEntry[]
}

/** One series (applications filed per month), so a trend line, one hue, no legend box. */
export function ActivityOverTimeChart({ overTime }: ActivityOverTimeChartProps) {
  const data: ChartDatum[] = overTime.map((entry) => ({
    label: formatMonthLabel(entry.period),
    value: entry.count,
  }))

  return (
    <ChartCard title="Applications over time">
      {data.length === 0 ? (
        <EmptyState message="Applications will show up here by the month you applied." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--viz-series-1)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--viz-series-1)', stroke: 'var(--viz-surface)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
