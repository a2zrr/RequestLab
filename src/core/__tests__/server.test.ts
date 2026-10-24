import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../../server/app.ts'
import type { ProxyResponse } from '../../shared/types.ts'

// Helper to build a mock Response-like object
function mockResponse(
  body: string,
  status: number,
  headers: Record<string, string> = {},
): Response {
  const headerMap = new Headers(headers)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(body)

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
    headers: headerMap,
    body: stream,
    // stub unused Response methods
    json: async () => JSON.parse(body),
    text: async () => body,
    arrayBuffer: async () => bytes.buffer,
    blob: async () => new Blob([bytes]),
    formData: async () => new FormData(),
    clone: () => mockResponse(body, status, headers),
    bodyUsed: false,
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
  } as unknown as Response
}

describe('POST /api/send', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 health check', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('returns 400 for missing url', async () => {
    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', headers: {} }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid method', async () => {
    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'PATCH', url: 'https://example.com', headers: {} }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-JSON body', async () => {
    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    expect(res.status).toBe(400)
  })

  it('proxies a successful GET request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse('{"hello":"world"}', 200, { 'content-type': 'application/json' })),
    )

    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', url: 'https://example.com', headers: {} }),
    })

    expect(res.status).toBe(200)
    const data = (await res.json()) as ProxyResponse
    expect(data.ok).toBe(true)
    expect(data.status).toBe(200)
    expect(data.body).toBe('{"hello":"world"}')
    expect(data.sizeBytes).toBeGreaterThan(0)
    expect(data.durationMs).toBeGreaterThanOrEqual(0)
    expect(data.truncated).toBe(false)
  })

  it('proxies a 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse('Not Found', 404)),
    )

    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', url: 'https://example.com/nope', headers: {} }),
    })

    const data = (await res.json()) as ProxyResponse
    expect(data.ok).toBe(false)
    expect(data.status).toBe(404)
  })

  it('returns ok:false on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure')),
    )

    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', url: 'https://unreachable.example.com', headers: {} }),
    })

    const data = (await res.json()) as ProxyResponse
    expect(data.ok).toBe(false)
    expect(data.status).toBe(0)
    expect(data.error).toBeTruthy()
  })

  it('returns ok:false on timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, options: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }),
    )

    const res = await app.request('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GET',
        url: 'https://slow.example.com',
        headers: {},
        timeoutMs: 1, // 1ms timeout to trigger immediately
      }),
    })

    const data = (await res.json()) as ProxyResponse
    expect(data.ok).toBe(false)
    expect(data.status).toBe(0)
  })
})
