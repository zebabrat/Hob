import type { InterviewCreateInput, InterviewDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function createInterview(
  applicationId: number,
  input: InterviewCreateInput,
): Promise<InterviewDto> {
  return apiFetch<InterviewDto>(`/applications/${applicationId}/interviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
