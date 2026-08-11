import type { SignInFormValues, SignUpFormValues } from '../types'

function readField(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export function readSignInValues(form: HTMLFormElement): SignInFormValues {
  return {
    email: readField(form, 'email'),
    // Passwords are taken as typed — trimming would silently change them.
    password: String(new FormData(form).get('password') ?? ''),
  }
}

export function readSignUpValues(form: HTMLFormElement): SignUpFormValues {
  return {
    ...readSignInValues(form),
    name: readField(form, 'name'),
  }
}
