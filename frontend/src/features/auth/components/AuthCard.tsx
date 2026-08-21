import type { ReactNode } from 'react'
import { Logo } from 'shared/components/Logo'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/**
 * The screen is the two panels, not a boxed card floating on a page — per
 * the mockup's "2 колонки 1fr/1fr... без внешней рамки/тени": a permanent
 * dark panel (not a theme, just this one screen's layout) and the form on
 * white. Below the lg breakpoint the dark panel drops out entirely rather
 * than squeezing beside the form — the mockup doesn't specify mobile
 * behavior, and a form-only screen reads better than two cramped columns.
 *
 * The brief's left panel calls for "3 метрики" (three usage numbers) at the
 * bottom. Real product-usage stats aren't something this app can honestly
 * show on the sign-in screen of an app that hasn't shipped to anyone yet —
 * inventing plausible-looking numbers there would be fabricated data
 * presented as real, not a design placeholder a viewer can tell is
 * illustrative. Kept the visual shape (three items, divided by hairlines)
 * but with the same short, honest value-prop copy the rest of the app
 * already uses (see Footer) instead of numbers.
 */
const VALUE_PROPS = [
  { label: 'Track', text: 'Every application, one place.' },
  { label: 'Focus', text: 'See what needs a reply today.' },
  { label: 'Calm', text: 'No noise, no clutter.' },
]

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-dark-surface px-12 py-12 lg:flex">
        <Logo variant="inverted" />

        <div>
          <h1 className="max-w-md text-5xl leading-[1.05] tracking-[-0.03em] text-dark-foreground">
            Every application,
            <br />
            one clear place.
          </h1>
          <p className="mt-4 max-w-sm text-lg text-text-tertiary">
            Track where things stand without the spreadsheet.
          </p>
        </div>

        <dl className="flex flex-col">
          {VALUE_PROPS.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline gap-4 border-t border-dark-line py-4 first:border-t-0 first:pt-0 last:pb-0"
            >
              <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-text-tertiary uppercase">
                {item.label}
              </dt>
              <dd className="text-sm text-dark-foreground">{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-3xl tracking-[-0.02em] text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-sm text-text-secondary">{footer}</p>
        </div>
      </div>
    </div>
  )
}
