import { describe, expect, it } from 'vitest'
import { readSignInValues, readSignUpValues } from './formValues'

function formWith(fields: Record<string, string>): HTMLFormElement {
  const form = document.createElement('form')

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.name = name
    input.value = value
    form.append(input)
  }

  return form
}

describe('reading form values', () => {
  it('trims the email but never the password', () => {
    const values = readSignInValues(
      formWith({ email: '  alice@example.com ', password: ' spaced pass ' }),
    )

    expect(values.email).toBe('alice@example.com')
    // Trimming would silently change what the user typed.
    expect(values.password).toBe(' spaced pass ')
  })

  it('returns empty strings for missing fields', () => {
    const values = readSignInValues(formWith({}))

    expect(values).toEqual({ email: '', password: '' })
  })

  it('reads the optional name on sign-up', () => {
    const values = readSignUpValues(
      formWith({ email: 'alice@example.com', password: 'supersecret', name: ' Alice ' }),
    )

    expect(values).toEqual({
      email: 'alice@example.com',
      password: 'supersecret',
      name: 'Alice',
    })
  })
})
