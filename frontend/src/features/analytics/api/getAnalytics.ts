import type { AnalyticsPeriod, AnalyticsResponse } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function getAnalytics(period: AnalyticsPeriod, signal?: AbortSignal): Promise<AnalyticsResponse> {
  return apiFetch<AnalyticsResponse>(`/applications/analytics?period=${period}`, { signal })
}
