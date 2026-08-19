import type { AttachmentDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

/**
 * The backend takes the file as the raw request body and its name in the
 * query string. apiFetch defaults every request body to `application/json`,
 * so the file's own type is passed as a header here — headers in `init`
 * override the default rather than merging under it.
 */
export function uploadAttachment(applicationId: number, file: File): Promise<AttachmentDto> {
  const query = new URLSearchParams({ fileName: file.name })

  return apiFetch<AttachmentDto>(`/applications/${applicationId}/attachments?${query}`, {
    method: 'POST',
    body: file,
    headers: { 'content-type': file.type || 'application/octet-stream' },
  })
}
