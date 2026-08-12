import { signInInputSchema, signUpInputSchema } from '@hob/shared'
import type { SignInFormValues, SignUpFormValues } from '../types'

/**
 * Checks the form against the very schema the backend validates with, so the
 * rules cannot drift apart: a mistyped email is caught before a request goes
 * out, and whatever passes here is what the API accepts.
 */
function firstMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Please check the form'
}

export function validateSignIn(values: SignInFormValues): string | null {
  const result = signInInputSchema.safeParse(values)
  return result.success ? null : firstMessage(result.error)
}

export function validateSignUp(values: SignUpFormValues): string | null {
  // An empty optional name is absent, not an empty string.
  const result = signUpInputSchema.safeParse({
    ...values,
    name: values.name || null,
  })
  return result.success ? null : firstMessage(result.error)
}
