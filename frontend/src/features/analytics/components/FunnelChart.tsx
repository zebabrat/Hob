import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FunnelEntry } from '@hob/shared'
import { statusLabel } from 'shared/helpers/labels'
import { TOOLTIP_STYLE } from '../helpers/tooltipStyle'
import { ChartCard } from './ChartCard'
import { EmptyState } from './EmptyState'

interface FunnelChartProps {
  funnel: FunnelEntry[]
}

/**
 * Where applications sit right now, one bar per status in pipeline order.
 * This is a single measure across ordered stages — magnitude, not identity —
 * so every bar carries the same ink rather than a color per status. The one
 * exception is Offer, which gets the app's single accent — the one stage
 * worth calling out, same as the board's Offer column and the metrics rows'
 * highlighted numbers.
 */
export function FunnelChart({ funnel }: FunnelChartProps) {
  const data = funnel.map((entry) => ({
    label: statusLabel(entry.status),
    value: entry.count,
    isOffer: entry.status === 'OFFER',
  }))
  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <ChartCard title="Funnel">
      {total === 0 ? (
        <EmptyState message="Add a few applications to see the funnel." />
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
              width={80}
              tick={{ fill: 'var(--viz-text-secondary)', fontSize: 12 }}
              stroke="var(--viz-axis)"
            />
            <Tooltip cursor={{ fill: 'var(--viz-grid)' }} contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="value"
              background={{ fill: 'var(--viz-track)' }}
              barSize={20}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.isOffer ? 'var(--viz-highlight)' : 'var(--viz-series-1)'}
                />
              ))}
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
