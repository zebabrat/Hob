import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { signUp } from '../api/signUp'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { validateSignUp } from '../helpers/validate'
import type { SignUpFormValues } from '../types'
import { useCurrentUser } from './useCurrentUser'

export function useSignUp() {
  const { setUser } = useCurrentUser()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(
    async (values: SignUpFormValues) => {
      const invalid = validateSignUp(values)
      if (invalid) {
        setError(invalid)
        return
      }

      const { name, ...credentials } = values
      setError(null)
      setIsSubmitting(true)

      try {
        // An empty optional name must go as null, not as an empty string.
        setUser(await signUp({ ...credentials, name: name || null }))
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
