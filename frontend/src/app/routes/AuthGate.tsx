import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useCurrentUser } from 'features/auth'
import { PageLoader } from 'shared/components/PageLoader'

/** The project's one full-page loading placeholder — also used as the Suspense fallback for lazy routes. */
export function Pending() {
  return <PageLoader />
}

/** Signed-in only. Waits for the session check so a reload does not bounce to sign-in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <Pending />
  if (!user) return <Navigate to="/sign-in" replace />

  return children
}

/** Signed-out only: keeps an authenticated user away from the auth forms. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <Pending />
  if (user) return <Navigate to="/board" replace />

  return children
}
