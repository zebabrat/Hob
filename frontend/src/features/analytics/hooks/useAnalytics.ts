import { useCallback, useEffect, useState } from 'react'
import type { AnalyticsPeriod, AnalyticsResponse } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { getAnalytics } from '../api/getAnalytics'

/** Every section re-scopes to this period together — see the mockup's "переключатель периода... пересчитывает все секции синхронно". */
export function useAnalytics(period: AnalyticsPeriod) {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)

      try {
        setData(await getAnalytics(period, signal))
        setError(null)
      } catch (err) {
        // An abort is the component going away, not a failure to report.
        if (signal?.aborted) return
        setError(toFormErrorMessage(err))
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [period],
  )

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
