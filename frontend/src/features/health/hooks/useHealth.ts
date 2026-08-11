import { useEffect, useState } from 'react'
import { getHealth } from '../api/getHealth'

interface UseHealthResult {
  status: string | null
  error: string | null
  isLoading: boolean
}

export function useHealth(): UseHealthResult {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((health) => setStatus(health.status))
      .catch((err: unknown) => {
        // An aborted request is a cleanup, not a failure worth showing.
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { status, error, isLoading }
}
