import type { ApplicationCreateInput, ApplicationDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function createApplication(input: ApplicationCreateInput): Promise<ApplicationDto> {
  return apiFetch<ApplicationDto>('/applications', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
