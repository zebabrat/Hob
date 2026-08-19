import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { updateApplication } from '../api/updateApplication'
import { toApplicationUpdateInput } from '../helpers/formValues'
import type { ApplicationEditFormValues } from '../types'

/**
 * Saves the detail form on demand — nothing here runs until `save` is called,
 * which is what keeps editing local to the form until the button is pressed.
 *
 * The PATCH response already carries the full application, interviews and
 * attachments included (the same shape GET returns), so it replaces the
 * whole object; there is nothing to merge by hand.
 */
export function useUpdateApplication(
  applicationId: number,
  setApplication: Dispatch<SetStateAction<ApplicationDto | null>>,
) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const save = useCallback(
    async (values: ApplicationEditFormValues) => {
      setError(null)
      setIsSubmitting(true)

      try {
        setApplication(await updateApplication(applicationId, toApplicationUpdateInput(values)))
      } catch (err) {
        setError(toFormErrorMessage(err))
      } finally {
        setIsSubmitting(false)
      }
    },
    [applicationId, setApplication],
  )

  return { save, error, isSubmitting }
}
