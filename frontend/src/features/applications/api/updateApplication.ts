import type { ApplicationDto, ApplicationUpdateInput } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

/** Partial edit. Sending one field leaves the rest of the application alone. */
export function updateApplication(
  id: number,
  input: ApplicationUpdateInput,
): Promise<ApplicationDto> {
  return apiFetch<ApplicationDto>(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
