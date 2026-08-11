import type { ErrorResponse } from '@hob/shared'

const API_PREFIX = '/api'

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
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
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
