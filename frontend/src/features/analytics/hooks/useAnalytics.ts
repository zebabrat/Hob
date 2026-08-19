import { useCallback, useEffect, useState } from 'react'
import type { AnalyticsResponse } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { getAnalytics } from '../api/getAnalytics'

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)

    try {
      setData(await getAnalytics(signal))
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

  return { data, isLoading, error, reload }
}
