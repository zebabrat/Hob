import type { AnalyticsResponse } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function getAnalytics(signal?: AbortSignal): Promise<AnalyticsResponse> {
  return apiFetch<AnalyticsResponse>('/applications/analytics', { signal })
}
