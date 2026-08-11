import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { signOut } from '../api/signOut'
import { useCurrentUser } from './useCurrentUser'

export function useSignOut() {
  const { setUser } = useCurrentUser()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await signOut()
    } finally {
      // Even if the request failed, drop the local session: the cookie is gone
      // or unusable, and keeping the user "signed in" would be a lie.
      setUser(null)
      setIsSubmitting(false)
      void navigate('/sign-in', { replace: true })
    }
  }, [navigate, setUser])

  return { submit, isSubmitting }
}
