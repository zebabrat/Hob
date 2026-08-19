import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WorkFormatEntry } from '@hob/shared'
import { workFormatLabel } from 'shared/helpers/labels'
import { TOOLTIP_STYLE } from '../helpers/tooltipStyle'
import { ChartCard } from './ChartCard'
import { EmptyState } from './EmptyState'

interface WorkFormatChartProps {
  byWorkFormat: WorkFormatEntry[]
  workFormatUnspecified: number
}

export function WorkFormatChart({ byWorkFormat, workFormatUnspecified }: WorkFormatChartProps) {
  // Each bar already carries its own name on the axis, so identity doesn't
  // need a color per category the way it would in a legend-only chart — one
  // ink for every bar, same as the magnitude charts above, per the app's
  // "one accent, everything else neutral" rule.
  const data = [
    ...byWorkFormat.map((entry) => ({
      label: workFormatLabel(entry.workFormat) ?? entry.workFormat,
      value: entry.count,
    })),
    { label: 'Not specified', value: workFormatUnspecified },
  ]
  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <ChartCard title="Work format">
      {total === 0 ? (
        <EmptyState message="Set a work format on an application to see the breakdown." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="var(--viz-grid)" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <Tooltip cursor={{ fill: 'var(--viz-grid)' }} contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="value"
              fill="var(--viz-series-1)"
              background={{ fill: 'var(--viz-track)' }}
              barSize={20}
            >
              <LabelList
                dataKey="value"
                position="right"
                style={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
