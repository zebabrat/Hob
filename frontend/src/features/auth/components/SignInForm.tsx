import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { useSignIn } from '../hooks/useSignIn'
import { readSignInValues } from '../helpers/formValues'
import { AuthCard } from './AuthCard'
import { FormError } from './FormError'
import { SubmitButton } from './SubmitButton'
import { TextField } from './TextField'

export function SignInForm() {
  const { submit, error, isSubmitting } = useSignIn()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit(readSignInValues(event.currentTarget))
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back to Hob"
      footer={
        <>
          No account yet?{' '}
          <Link
            to="/sign-up"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            Sign up
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
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
