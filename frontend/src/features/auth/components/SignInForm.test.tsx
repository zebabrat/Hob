import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from './AuthProvider'
import { SignInForm } from './SignInForm'

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function renderForm() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignInForm />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function submit(container: HTMLElement, email: string, password: string) {
  const form = container.querySelector('form')
  const emailInput = container.querySelector<HTMLInputElement>('input[name="email"]')
  const passwordInput = container.querySelector<HTMLInputElement>('input[name="password"]')

  if (!form || !emailInput || !passwordInput) throw new Error('form is not rendered')

  emailInput.value = email
  passwordInput.value = password
  form.requestSubmit()
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  // The provider checks the session on mount; signed out by default.
  fetchMock.mockResolvedValue(
    jsonResponse({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required' }, 401),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SignInForm', () => {
  it('shows the fields and the link to sign-up', async () => {
    renderForm()

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/sign-up')
  })

  it('shows the backend message under the form when the password is wrong', async () => {
    const { container } = renderForm()
    await screen.findByRole('heading', { name: 'Sign in' })

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' },
        401,
      ),
    )
    submit(container, 'alice@example.com', 'wrongpassword')

    // Not a console error and not a blank screen — the user must see why.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid email or password')
  })

  it('sends what was typed to the sign-in endpoint', async () => {
    const { container } = renderForm()
    await screen.findByRole('heading', { name: 'Sign in' })

    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, email: 'alice@example.com', name: null }))
    submit(container, 'alice@example.com', 'supersecret')

    await waitFor(() => {
      const signInCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/sign-in'))
      expect(signInCall).toBeDefined()
      expect(JSON.parse(signInCall![1].body)).toEqual({
        email: 'alice@example.com',
        password: 'supersecret',
      })
    })
  })

  it('keeps the form usable after a failed attempt', async () => {
    const { container } = renderForm()
    await screen.findByRole('heading', { name: 'Sign in' })

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' }, 401),
    )
    submit(container, 'alice@example.com', 'wrongpassword')
    await screen.findByRole('alert')

    // The button must come back from its pending state, or a typo locks the user out.
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
})
