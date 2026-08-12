import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('prefixes the path with /api and sends credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }))

    await apiFetch('/health')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/health')
    // Without this the session cookie is dropped on a cross-origin API.
    expect(init.credentials).toBe('include')
  })

  it('sets the JSON content type only when there is a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await apiFetch('/auth/sign-out', { method: 'POST' })
    const withoutBody = fetchMock.mock.calls[0][1].headers

    await apiFetch('/auth/sign-in', { method: 'POST', body: '{}' })
    const withBody = fetchMock.mock.calls[1][1].headers

    // A bodyless request claiming application/json makes Fastify answer 400,
    // which once made sign-out fail while the UI still looked signed out.
    expect(withoutBody['content-type']).toBeUndefined()
    expect(withBody['content-type']).toBe('application/json')
  })

  it('returns undefined for 204 instead of trying to parse a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiFetch('/auth/sign-out', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('throws ApiError carrying the backend message and status', async () => {
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { statusCode: 409, error: 'Conflict', message: 'Email a@b.co is already taken' },
          409,
        ),
      ),
    )

    await expect(apiFetch('/auth/sign-up', { method: 'POST', body: '{}' })).rejects.toThrow(
      ApiError,
    )

    await expect(
      apiFetch('/auth/sign-up', { method: 'POST', body: '{}' }).catch((err: ApiError) => ({
        status: err.statusCode,
        message: err.message,
      })),
    ).resolves.toEqual({ status: 409, message: 'Email a@b.co is already taken' })
  })

  it('falls back to the status line when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('gateway blew up', { status: 502 }))

    await expect(apiFetch('/health')).rejects.toThrow('502')
  })
})
