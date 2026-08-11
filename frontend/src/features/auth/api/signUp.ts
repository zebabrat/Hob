import type { SignUpInput, UserDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function signUp(input: SignUpInput): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
