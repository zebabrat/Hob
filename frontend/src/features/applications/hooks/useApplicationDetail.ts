import { useCallback, useEffect, useState } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { getApplication } from '../api/getApplication'

/**
 * Owns the detail page's one piece of data. `setApplication` is handed to
 * every other hook on the page (edit, interviews, attachments) so all of them
 * write into the same object rather than each keeping its own copy that could
 * drift from the others.
 */
export function useApplicationDetail(id: number) {
  const [application, setApplication] = useState<ApplicationDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)

      try {
        setApplication(await getApplication(id, signal))
        setError(null)
      } catch (err) {
        // An abort is the component going away, not a failure to report.
        if (signal?.aborted) return
        setError(toFormErrorMessage(err))
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { application, setApplication, isLoading, error }
}
