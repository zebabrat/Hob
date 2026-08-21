import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { cn } from 'shared/lib/utils'
import { Logo } from './Logo'

interface NavItem {
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Board', to: '/board' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Archive', to: '/archive' },
]

interface HeaderProps {
  /** Rendered at the right edge — the connected UserMenu, or nothing signed out. */
  userSlot?: ReactNode
}

/**
 * The search box only appears on the board, per the mockup — 1e (analytics)
 * replaces it with a period toggle, 1c (detail) has no header row of its own
 * at all. Written through to the URL's `q` param so the board can read it
 * back out with its own useSearchParams, and a reload or a shared link
 * keeps the filter.
 *
 * The input's own value is local state, not `searchParams.get('q')` read
 * fresh on every render: two keystrokes typed close together can both fire
 * before the URL update from the first one has committed and re-rendered
 * this component, so an onChange reading `searchParams` from its closure
 * sees the pre-first-keystroke value and overwrites it — dropping the
 * character (found by hand while testing the board's search box). Keeping
 * the character the user is looking at in local state, and pushing to the
 * URL through setSearchParams's updater-function form (never a stale
 * closure over `searchParams`), avoids the race entirely.
 */
function CompanySearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(() => searchParams.get('q') ?? '')

  return (
    <div className="flex w-56 items-center gap-2 border border-border px-3 py-1.5">
      <span className="font-mono text-[0.625rem] text-text-quaternary">⌘K</span>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          setValue(next)
          setSearchParams(
            (previous) => {
              const params = new URLSearchParams(previous)
              if (next) {
                params.set('q', next)
              } else {
                params.delete('q')
              }
              return params
            },
            { replace: true },
          )
        }}
        placeholder="Search companies"
        className="w-full border-0 bg-transparent p-0 text-[0.8125rem] text-foreground outline-none placeholder:text-text-tertiary"
      />
    </div>
  )
}

/**
 * A plain white panel on the page canvas, 60px tall per the mockup. Tabs
 * read their active state from the route (useLocation, a router concern,
 * not a feature one); who the signed-in user is comes in as userSlot from
 * the caller — shared/ cannot reach into features/auth for that itself.
 */
export function Header({ userSlot }: HeaderProps) {
  const location = useLocation()
  const onBoard = location.pathname.startsWith('/board')

  return (
    <header className="sticky top-0 z-40 h-15 border-b border-border bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-6">
        <div className="flex h-full items-center gap-9">
          <Link to="/board" className="shrink-0">
            <Logo />
          </Link>

          <nav className="flex h-full items-center gap-6">
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
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {onBoard && <CompanySearch />}
          {userSlot}
        </div>
      </div>
    </header>
  )
}
