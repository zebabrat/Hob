import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from 'shared/lib/utils'
import { Logo } from './Logo'

interface NavItem {
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Board', to: '/board' },
  { label: 'Analytics', to: '/analytics' },
]

interface HeaderProps {
  /** Rendered at the right edge — the connected UserMenu, or nothing signed out. */
  userSlot?: ReactNode
}

/**
 * A plain white panel on the page canvas, 60px tall per the mockup. Tabs
 * read their active state from the route (useLocation, a router concern,
 * not a feature one); who the signed-in user is comes in as userSlot from
 * the caller — shared/ cannot reach into features/auth for that itself.
 */
export function Header({ userSlot }: HeaderProps) {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 h-15 border-b border-border bg-white">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-8 px-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex h-full flex-1 items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex h-full items-center font-mono text-xs tracking-[0.08em] text-text-secondary uppercase transition-colors hover:text-foreground',
                  isActive &&
                    'text-foreground after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-highlight after:content-[""]',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center">{userSlot}</div>
      </div>
    </header>
  )
}
