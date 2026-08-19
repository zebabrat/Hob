import type { ApplicationDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

/** Every application of the signed-in user, rounds and files included. */
export function getApplications(signal?: AbortSignal): Promise<ApplicationDto[]> {
  return apiFetch<ApplicationDto[]>('/applications', { signal })
}
