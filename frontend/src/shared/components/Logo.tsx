interface LogoProps {
  /** The sign-in screen's dark left panel needs the wordmark in white. */
  variant?: 'default' | 'inverted'
}

/**
 * A pure wordmark, no icon — the mockup's "HOB" is mono, uppercase, and
 * heavily tracked (letter-spacing 0.16em), nothing else. Simpler than the
 * previous circular-dot mark and cheaper: no shape to keep in sync with the
 * rest of the palette.
 */
export function Logo({ variant = 'default' }: LogoProps) {
  return (
    <span
      className={
        variant === 'inverted'
          ? 'font-mono text-sm font-semibold tracking-[0.16em] text-dark-foreground uppercase'
          : 'font-mono text-sm font-semibold tracking-[0.16em] text-foreground uppercase'
      }
    >
      Hob
    </span>
  )
}
