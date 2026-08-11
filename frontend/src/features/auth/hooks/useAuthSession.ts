import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserDto } from '@hob/shared'
import { getMe } from '../api/getMe'
import type { AuthContextValue } from './useCurrentUser'

/** Owns the session state behind AuthProvider; components read it via useCurrentUser. */
export function useAuthSession(): AuthContextValue {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser(await getMe())
    } catch {
      // 401 is the normal "signed out" answer, so no error state here.
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return useMemo(
    () => ({ user, isLoading, setUser, refresh }),
    [user, isLoading, refresh],
  )
}
