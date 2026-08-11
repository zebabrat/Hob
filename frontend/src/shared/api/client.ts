import type { ErrorResponse } from '@hob/shared'

const API_PREFIX = '/api'

/**
 * Origin of the backend, e.g. https://api.example.com — set it when the API is
 * deployed separately from the static frontend. Left empty (the default) requests
 * stay same-origin: in dev the Vite proxy forwards /api, in a single-origin
 * deployment the platform routes it.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/** Non-2xx response from the backend, carrying the status code for callers that branch on it. */
export class ApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ErrorResponse>
    if (typeof body.message === 'string') return body.message
  } catch {
    // Body was empty or not JSON — fall back to the status line.
  }
  return `${response.status} ${response.statusText}`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    // The session cookie must travel with every request; without this it is
    // dropped as soon as the API lives on another origin.
    credentials: 'include',
    headers: {
      // Only when something is actually sent: Fastify rejects a bodyless
      // request that claims application/json with 400.
      ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  // 204 has no body, so json() would throw.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
