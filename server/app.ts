import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ProxyRequest, ProxyResponse } from '../src/shared/types.ts'

const app = new Hono()

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5MB

app.use(
  '*',
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/send', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Request body must be an object' }, 400)
  }

  const req = body as Partial<ProxyRequest>

  // Validate required fields
  if (!req.method || !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return c.json({ error: 'Invalid or missing method' }, 400)
  }
  if (!req.url || typeof req.url !== 'string') {
    return c.json({ error: 'Invalid or missing url' }, 400)
  }
  if (req.headers !== undefined && (typeof req.headers !== 'object' || Array.isArray(req.headers))) {
    return c.json({ error: 'headers must be an object' }, 400)
  }
  if (req.timeoutMs !== undefined && typeof req.timeoutMs !== 'number') {
    return c.json({ error: 'timeoutMs must be a number' }, 400)
  }

  const { method, url, headers = {}, body: reqBody, timeoutMs = 30_000 } = req as ProxyRequest

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)

  const start = Date.now()

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: headers as Record<string, string>,
      signal: controller.signal,
    }

    if (reqBody !== undefined && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.body = reqBody
    }

    const response = await fetch(url, fetchOptions)

    clearTimeout(timer)
    const durationMs = Date.now() - start

    // Read body capped at 5MB
    const reader = response.body?.getReader()
    let bytes = 0
    let truncated = false
    const chunks: Uint8Array[] = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          bytes += value.byteLength
          if (bytes <= MAX_BODY_BYTES) {
            chunks.push(value)
          } else {
            truncated = true
            break
          }
        }
      }
    }

    const decoder = new TextDecoder()
    const responseBody = chunks.map((c) => decoder.decode(c, { stream: true })).join('')

    // Collect response headers (never log them)
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const result: ProxyResponse = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      sizeBytes: bytes,
      durationMs,
      truncated,
    }

    return c.json(result)
  } catch (err: unknown) {
    clearTimeout(timer)
    const durationMs = Date.now() - start

    const isTimeout =
      err instanceof Error && (err.name === 'AbortError' || (err as Error & { cause?: unknown }).cause === 'timeout')

    const errorMsg = isTimeout
      ? 'Request timed out'
      : err instanceof Error
        ? err.message
        : 'Network error'

    const result: ProxyResponse = {
      ok: false,
      status: 0,
      statusText: '',
      headers: {},
      body: '',
      sizeBytes: 0,
      durationMs,
      truncated: false,
      error: errorMsg,
    }

    return c.json(result)
  }
})

export default app
