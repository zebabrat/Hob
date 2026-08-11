import type { SignInInput, UserDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

export function signIn(input: SignInInput): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
