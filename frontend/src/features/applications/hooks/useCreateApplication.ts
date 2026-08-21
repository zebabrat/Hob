import { useCallback, useState } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { createApplication } from '../api/createApplication'
import { toCreateInput } from '../helpers/formValues'
import type { ApplicationFormValues } from '../types'

/**
 * Everything the create dialog needs: whether it is open, what it is doing, and
 * what went wrong.
 *
 * Whether the dialog is open lives here rather than in the board because it is
 * the same state as the submission it belongs to — the dialog closes when the
 * application is created, and a failed submit has to keep it open with the
 * typed values still in it.
 *
 * No optimistic insert: the row only exists once the server has given it an id,
 * and a placeholder card would be something the user could try to drag.
 */
export function useCreateApplication(onCreated: (application: ApplicationDto) => void) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = useCallback(() => {
    setError(null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const submit = useCallback(
    // keepOpen: the mockup's "⌘ ↵ Save and add another" — the dialog stays
    // open with a blank form instead of closing, for filing several
    // applications from the same job-board tab in a row.
    async (values: ApplicationFormValues, keepOpen = false) => {
      setError(null)
      setIsSubmitting(true)

      try {
        onCreated(await createApplication(toCreateInput(values)))
        if (!keepOpen) setIsOpen(false)
      } catch (err) {
        setError(toFormErrorMessage(err))
      } finally {
        setIsSubmitting(false)
      }
    },
    [onCreated],
  )

  return { isOpen, open, close, submit, error, isSubmitting }
}
