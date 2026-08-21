import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { isPasswordStrongEnough } from '@hob/shared'
import { useSignUp } from '../hooks/useSignUp'
import { readSignUpValues } from '../helpers/formValues'
import { AuthCard } from './AuthCard'
import { FormError } from 'shared/components/FormError'
import { PasswordField } from './PasswordField'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'

export function SignUpForm() {
  const { submit, error, isSubmitting } = useSignUp()
  const [password, setPassword] = useState('')
  const isPasswordTooWeak = !isPasswordStrongEnough(password)

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
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={error} />

        <TextField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Optional"
          disabled={isSubmitting}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isSubmitting}
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={isPasswordTooWeak}
          pendingLabel="Creating account…"
        >
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
