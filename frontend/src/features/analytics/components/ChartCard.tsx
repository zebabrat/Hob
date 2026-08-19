import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'shared/components/ui/card'

interface ChartCardProps {
  title: string
  children: ReactNode
}

/**
 * The frame every chart sits in: a title and the `viz` scope the chart
 * palette's CSS variables (app/index.css) are defined under. Kept separate
 * from EmptyState so a chart can render its title even while explaining that
 * it has nothing to plot yet.
 */
export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card className="viz">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
