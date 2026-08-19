import type { ApplicationDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function getApplication(id: number, signal?: AbortSignal): Promise<ApplicationDto> {
  return apiFetch<ApplicationDto>(`/applications/${id}`, { signal })
}
