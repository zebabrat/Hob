import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useCurrentUser } from 'features/auth'

function Pending() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
      Loading…
    </div>
  )
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
  if (user) return <Navigate to="/" replace />

  return children
}
