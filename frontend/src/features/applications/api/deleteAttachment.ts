import { apiFetch } from 'shared/api/client'

export function deleteAttachment(id: number): Promise<void> {
  return apiFetch<void>(`/attachments/${id}`, { method: 'DELETE' })
}
