import type { UserDto } from '@hob/shared'
import { apiFetch } from 'shared/api/client'

/** Resolves the session cookie into a user; throws ApiError(401) when signed out. */
export function getMe(signal?: AbortSignal): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/me', { signal })
}
