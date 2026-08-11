import type { ReactNode } from 'react'
import { useAuthSession } from '../hooks/useAuthSession'
import { AuthContext } from '../hooks/useCurrentUser'

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthSession()

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
