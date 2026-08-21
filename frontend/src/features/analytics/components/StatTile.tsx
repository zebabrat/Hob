import { Card, CardContent } from 'shared/components/ui/card'

interface StatTileProps {
  label: string
  value: string
}

/** A single headline number — SalaryStats' three tiles. */
export function StatTile({ label, value }: StatTileProps) {
  return (
    <Card>
      <CardContent>
        <p className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
