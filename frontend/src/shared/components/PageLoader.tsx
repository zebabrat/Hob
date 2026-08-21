interface PageLoaderProps {
  label?: string
}

/**
 * The full-page loading state for the moment before any real layout is
 * known — the session check gating every protected route, and the
 * Suspense fallback for the lazy analytics chunk. A skeleton needs a shape
 * to mimic; this is what shows before there is one.
 */
export function PageLoader({ label = 'Loading' }: PageLoaderProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background">
      <span className="font-mono text-sm font-medium tracking-[0.16em] text-foreground uppercase">
        HOB
      </span>
      <div className="relative h-px w-28 overflow-hidden bg-border-weak">
        <div
          className="absolute inset-y-0 w-[35%] bg-highlight"
          style={{ animation: 'loader-sweep 1.1s ease-in-out infinite' }}
        />
      </div>
      <span className="font-mono text-[0.625rem] tracking-[0.09em] text-text-tertiary uppercase">
        {label}
      </span>
    </div>
  )
}
