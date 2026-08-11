import type { HealthResponse } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health', { signal })
}
