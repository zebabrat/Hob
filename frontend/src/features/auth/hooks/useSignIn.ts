import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { signIn } from '../api/signIn'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { validateSignIn } from '../helpers/validate'
import type { SignInFormValues } from '../types'
import { useCurrentUser } from './useCurrentUser'

export function useSignIn() {
  const { setUser } = useCurrentUser()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(
    async (values: SignInFormValues) => {
      const invalid = validateSignIn(values)
      if (invalid) {
        setError(invalid)
        return
      }

      setError(null)
      setIsSubmitting(true)

      try {
        setUser(await signIn(values))
        void navigate('/', { replace: true })
      } catch (err) {
        setError(toFormErrorMessage(err))
        setIsSubmitting(false)
      }
    },
    [navigate, setUser],
  )

  return { submit, error, isSubmitting }
}
