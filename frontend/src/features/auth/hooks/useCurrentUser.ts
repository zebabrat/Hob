import { createContext, useContext } from 'react'
import type { UserDto } from '@hob/shared'

export interface AuthContextValue {
  user: UserDto | null
  /** True while the initial /auth/me check is in flight — routes must wait for it. */
  isLoading: boolean
  setUser: (user: UserDto | null) => void
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useCurrentUser(): AuthContextValue {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useCurrentUser must be used inside <AuthProvider>')
  }

  return value
}
