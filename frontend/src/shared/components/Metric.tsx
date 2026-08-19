import { cn } from 'shared/lib/utils'

interface MetricProps {
  label: string
  value: string
  highlight?: boolean
  /** 'lg' (default) for a page hero; 'sm' for a tighter inline header like the application detail's. */
  size?: 'sm' | 'lg'
}

/**
 * One number in a hero's metrics row, divided from its neighbors by a
 * hairline rather than sitting in its own boxed card — the board header,
 * the application detail header, and the analytics hero all want the exact
 * same shape, which is what promoted this out of the applications feature
 * the moment analytics needed it too.
 */
export function Metric({ label, value, highlight, size = 'lg' }: MetricProps) {
  return (
    <div className="flex flex-col gap-1 border-l border-border-weak pl-4 first:border-l-0 first:pl-0">
      <span className="font-mono text-[0.625rem] tracking-[0.08em] text-text-secondary uppercase">
        {label}
      </span>
      <span
        className={cn(
          size === 'lg' ? 'text-3xl' : 'text-lg',
          highlight ? 'text-highlight-text' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}
