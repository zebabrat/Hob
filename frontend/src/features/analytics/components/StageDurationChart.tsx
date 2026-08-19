import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StageDurationEntry } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import { formatDays } from '../helpers/formatDays'
import { TOOLTIP_STYLE } from '../helpers/tooltipStyle'
import { ChartCard } from './ChartCard'
import { EmptyState } from './EmptyState'

interface StageDurationChartProps {
  avgTimePerStage: StageDurationEntry[]
}

/**
 * How long applications typically sit at each stage before moving on. A
 * status nothing has ever reached (avgDays null — sampleCount zero) is left
 * out rather than drawn as a zero-length bar, which would read as "instant"
 * rather than "no data".
 */
export function StageDurationChart({ avgTimePerStage }: StageDurationChartProps) {
  /*
   * value stays the raw, unrounded avgDays — rounding it here for display
   * would round a genuinely tiny-but-real duration straight down to 0 and
   * feed the bar a literal zero length, which looks exactly like "no data"
   * even though sampleCount says otherwise. formatDays does the rounding
   * only for the text (and already renders anything under a day as
   * "< 1 day" rather than a misleading "0.0 days").
   */
  const data = avgTimePerStage.flatMap((entry) => {
    if (entry.avgDays === null) return []
    return [{ label: statusLabel(entry.status), value: entry.avgDays }]
  })

  return (
    <ChartCard title="Average time per stage">
      {data.length === 0 ? (
        <EmptyState message="Move an application to a new stage to see how long each one takes." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid horizontal={false} stroke="var(--viz-grid)" />
            {/* Durations are routinely fractional (2.5 days), unlike a count axis. */}
            <XAxis
              type="number"
              tickFormatter={(tick: number) => formatDays(tick)}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <YAxis
              type="category"
              dataKey="label"
              width={80}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <Tooltip
              cursor={{ fill: 'var(--viz-grid)' }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [formatDays(Number(value)), 'Average']}
            />
            <Bar
              dataKey="value"
              fill="var(--viz-series-1)"
              background={{ fill: 'var(--viz-track)' }}
              barSize={20}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(label) => formatDays(Number(label))}
                style={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
