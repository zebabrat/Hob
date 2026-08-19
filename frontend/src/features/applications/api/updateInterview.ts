import type { InterviewDto, InterviewUpdateInput } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function updateInterview(id: number, input: InterviewUpdateInput): Promise<InterviewDto> {
  return apiFetch<InterviewDto>(`/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
