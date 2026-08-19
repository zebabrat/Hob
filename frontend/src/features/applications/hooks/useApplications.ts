import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { getApplications } from '../api/getApplications'
import { groupByStatus } from '../helpers/groupByStatus'

/**
 * Owns the board's data: the flat list from the API, and the columns derived
 * from it.
 *
 * The list is the state and the columns are computed, not stored twice. Keeping
 * both would mean every move has to update two things that can disagree.
 */
export function useApplications() {
  const [applications, setApplications] = useState<ApplicationDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)

    try {
      setApplications(await getApplications(signal))
      setError(null)
    } catch (err) {
      // An abort is the component going away, not a failure to report.
      if (signal?.aborted) return
      setError(toFormErrorMessage(err))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const reload = useCallback(() => {
    void load()
  }, [load])

  /** Puts a freshly created application on the board without refetching. */
  const addApplication = useCallback((application: ApplicationDto) => {
    setApplications((current) => [application, ...current])
  }, [])

  const columns = useMemo(() => groupByStatus(applications), [applications])

  return {
    applications,
    columns,
    isLoading,
    error,
    setApplications,
    addApplication,
    reload,
  }
}
