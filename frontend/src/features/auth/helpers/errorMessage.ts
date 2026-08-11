import { ApiError } from 'shared/api/client'

/**
 * Turns whatever the request threw into a line that can be shown under a form.
 * The backend already sends readable messages ("Email … is already taken"), so
 * those are passed through; anything else gets a generic fallback.
 */
export function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}
