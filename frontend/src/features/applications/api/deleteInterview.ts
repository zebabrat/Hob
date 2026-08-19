import { apiFetch } from 'shared/api/client'

export function deleteInterview(id: number): Promise<void> {
  return apiFetch<void>(`/interviews/${id}`, { method: 'DELETE' })
}
