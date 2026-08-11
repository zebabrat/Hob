import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { PASSWORD_MIN_LENGTH } from '@hob/shared'
import { useSignUp } from '../hooks/useSignUp'
import { readSignUpValues } from '../helpers/formValues'
import { AuthCard } from './AuthCard'
import { FormError } from './FormError'
import { SubmitButton } from './SubmitButton'
import { TextField } from './TextField'

export function SignUpForm() {
  const { submit, error, isSubmitting } = useSignUp()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit(readSignUpValues(event.currentTarget))
  }

  return (
    <AuthCard
      title="Sign up"
      subtitle="Create your Hob account"
      footer={
        <>
          Already registered?{' '}
          <Link
            to="/sign-in"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={error} />

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isSubmitting}
        />

        <TextField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Optional"
          disabled={isSubmitting}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        />

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
