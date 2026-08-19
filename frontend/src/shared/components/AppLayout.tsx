import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

interface AppLayoutProps {
  children: ReactNode
  /**
   * The signed-in user menu for the header's right edge. Passed in rather
   * than rendered here: it is features/auth's UserMenu, and shared/ cannot
   * import from features/ — the caller (app/router.tsx, which is allowed to
   * reach into features/) wires the two together.
   */
  headerUserSlot?: ReactNode
}

/**
 * Sticky header, content, footer at the bottom — the shell every protected
 * page sits in. Wider than the previous pastel layout (max-w-7xl, not
 * max-w-5xl): the board needs the room for six columns, and the mockup's
 * hero/metrics rows read as full-bleed rather than a narrow centered column.
 */
export function AppLayout({ children, headerUserSlot }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header userSlot={headerUserSlot} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">{children}</main>
      <Footer />
    </div>
  )
}
