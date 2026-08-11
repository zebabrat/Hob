import { apiFetch } from 'shared/api/client'

export function signOut(): Promise<void> {
  return apiFetch<void>('/auth/sign-out', { method: 'POST' })
}
