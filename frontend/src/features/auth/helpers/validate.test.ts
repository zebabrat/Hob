import { describe, expect, it } from 'vitest'
import { PASSWORD_MIN_LENGTH } from '@hob/shared'
import { validateSignIn, validateSignUp } from './validate'

describe('validateSignIn', () => {
  it('accepts a filled form', () => {
    expect(
      validateSignIn({ email: 'alice@example.com', password: 'supersecret' }),
    ).toBeNull()
  })

  it('catches a mistyped email before a request goes out', () => {
    expect(validateSignIn({ email: 'not-an-email', password: 'supersecret' })).toBeTypeOf(
      'string',
    )
  })

  it('does not impose a password length on sign-in', () => {
    // Old passwords must keep working even if the rule tightens later.
    expect(validateSignIn({ email: 'alice@example.com', password: 'short' })).toBeNull()
  })
})

describe('validateSignUp', () => {
  it('accepts a filled form with and without a name', () => {
    expect(
      validateSignUp({ email: 'alice@example.com', password: 'supersecret', name: 'Alice' }),
    ).toBeNull()
    expect(
      validateSignUp({ email: 'alice@example.com', password: 'supersecret', name: '' }),
    ).toBeNull()
  })

  it('applies the same minimum length the API enforces', () => {
    const tooShort = 'x'.repeat(PASSWORD_MIN_LENGTH - 1)

    expect(
      validateSignUp({ email: 'alice@example.com', password: tooShort, name: '' }),
    ).toBeTypeOf('string')
  })
})
