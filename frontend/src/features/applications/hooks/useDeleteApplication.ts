import { useCallback, useState } from 'react'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { deleteApplication } from '../api/deleteApplication'

/**
 * Unlike the other detail-page hooks, a successful delete has nothing to
 * merge back into `application` state — the row is gone. The caller reads
 * the boolean `remove` resolves to and decides what "gone" means for it:
 * the detail page navigates away, the archive list drops the row in place.
 */
export function useDeleteApplication(applicationId: number) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = useCallback(async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await deleteApplication(applicationId)
      return true
    } catch (err) {
      setError(toFormErrorMessage(err))
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [applicationId])

  return { remove, isDeleting, error }
}
