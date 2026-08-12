import { describe, expect, it } from 'vitest'
import { ApiError } from 'shared/api/client'
import { toFormErrorMessage } from './errorMessage'

describe('toFormErrorMessage', () => {
  it('passes the backend message through', () => {
    expect(toFormErrorMessage(new ApiError('Invalid email or password', 401))).toBe(
      'Invalid email or password',
    )
  })

  it('uses the message of an ordinary error', () => {
    expect(toFormErrorMessage(new Error('Failed to fetch'))).toBe('Failed to fetch')
  })

  it('falls back to a readable line for anything else', () => {
    expect(toFormErrorMessage('boom')).toBe('Something went wrong. Please try again.')
    expect(toFormErrorMessage(new Error(''))).toBe('Something went wrong. Please try again.')
  })
})
