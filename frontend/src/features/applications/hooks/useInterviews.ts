import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { createInterview } from '../api/createInterview'
import { deleteInterview } from '../api/deleteInterview'
import { updateInterview } from '../api/updateInterview'
import { toInterviewCreateInput, toInterviewUpdateInput } from '../helpers/formValues'
import type { InterviewFormValues } from '../types'

/**
 * Add, edit and delete for one application's interview rounds — each its own
 * request, independent of the application form's Save button.
 *
 * Rounds live on `application.interviews`, the same object useApplicationDetail
 * owns, rather than in a second list here: keeping one copy is what makes the
 * detail page and this hook agree by construction instead of by discipline.
 */
export function useInterviews(
  applicationId: number,
  setApplication: Dispatch<SetStateAction<ApplicationDto | null>>,
) {
  const [error, setError] = useState<string | null>(null)
  // Which round an action is in flight for — 'new' for the add form, an id for
  // an edit or a delete. One at a time is all a single detail page ever needs.
  const [pendingId, setPendingId] = useState<number | 'new' | null>(null)

  const add = useCallback(
    async (values: InterviewFormValues) => {
      setError(null)
      setPendingId('new')

      try {
        const created = await createInterview(applicationId, toInterviewCreateInput(values))
        setApplication((current) =>
          current ? { ...current, interviews: [...current.interviews, created] } : current,
        )
        return true
      } catch (err) {
        setError(toFormErrorMessage(err))
        return false
      } finally {
        setPendingId(null)
      }
    },
    [applicationId, setApplication],
  )

  const update = useCallback(
    async (interviewId: number, values: InterviewFormValues) => {
      setError(null)
      setPendingId(interviewId)

      try {
        const updated = await updateInterview(interviewId, toInterviewUpdateInput(values))
        setApplication((current) =>
          current
            ? {
                ...current,
                interviews: current.interviews.map((interview) =>
                  interview.id === interviewId ? updated : interview,
                ),
              }
            : current,
        )
        return true
      } catch (err) {
        setError(toFormErrorMessage(err))
        return false
      } finally {
        setPendingId(null)
      }
    },
    [setApplication],
  )

  const remove = useCallback(
    async (interviewId: number) => {
      setError(null)
      setPendingId(interviewId)

      try {
        await deleteInterview(interviewId)
        setApplication((current) =>
          current
            ? {
                ...current,
                interviews: current.interviews.filter(
                  (interview) => interview.id !== interviewId,
                ),
              }
            : current,
        )
      } catch (err) {
        setError(toFormErrorMessage(err))
      } finally {
        setPendingId(null)
      }
    },
    [setApplication],
  )

  return { add, update, remove, pendingId, error }
}
