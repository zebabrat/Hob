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
  // Long enough and varied enough to clear scorePassword's minimum — plain
  // 'supersecret' is too weak now that sign-up enforces that too.
  const STRONG_PASSWORD = 'Sup3rSecret!42'

  it('accepts a filled form with and without a name', () => {
    expect(
      validateSignUp({ email: 'alice@example.com', password: STRONG_PASSWORD, name: 'Alice' }),
    ).toBeNull()
    expect(
      validateSignUp({ email: 'alice@example.com', password: STRONG_PASSWORD, name: '' }),
    ).toBeNull()
  })

  it('applies the same minimum length the API enforces', () => {
    const tooShort = 'x'.repeat(PASSWORD_MIN_LENGTH - 1)

    expect(
      validateSignUp({ email: 'alice@example.com', password: tooShort, name: '' }),
    ).toBeTypeOf('string')
  })

  it('rejects a password that is long enough but too weak', () => {
    // 8+ characters, but a single repeated word — below MIN_PASSWORD_STRENGTH
    // even though PASSWORD_MIN_LENGTH alone would let it through.
    expect(
      validateSignUp({ email: 'alice@example.com', password: 'lowercase', name: '' }),
    ).toBeTypeOf('string')
  })
})
