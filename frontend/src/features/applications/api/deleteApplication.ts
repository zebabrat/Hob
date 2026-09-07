import { apiFetch } from 'shared/api/client'

export function deleteApplication(id: number): Promise<void> {
  return apiFetch<void>(`/applications/${id}`, { method: 'DELETE' })
}
