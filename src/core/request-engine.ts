import type { RequestDef, ProxyResponse } from '../shared/types.ts'
import { buildProxyRequest } from './request-builder.ts'

export function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

export function prettyJson(text: string): string | null {
  const parsed = tryParseJson(text)
  if (!parsed.ok) return null
  return JSON.stringify(parsed.value, null, 2)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function statusCategory(
  status: number,
): 'success' | 'redirect' | 'client-error' | 'server-error' | 'network-error' {
  if (status === 0) return 'network-error'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'client-error'
  return 'server-error'
}

export async function sendRequest(
  req: RequestDef,
  options?: {
    signal?: AbortSignal
    baseUrl?: string
    vars?: Record<string, string>
  },
): Promise<ProxyResponse & { missingVariables: string[] }> {
  const { signal, baseUrl = '', vars } = options ?? {}
  const { proxyRequest, missingVariables } = buildProxyRequest(req, vars)

  const aborted = (): ProxyResponse & { missingVariables: string[] } => ({
    ok: false,
    status: 0,
    statusText: '',
    headers: {},
    body: '',
    sizeBytes: 0,
    durationMs: 0,
    truncated: false,
    error: 'Request cancelled',
    missingVariables,
  })

  if (signal?.aborted) return aborted()

  try {
    const fetchResponse = await fetch(`${baseUrl}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyRequest),
      signal,
    })

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text().catch(() => '')
      return {
        ok: false,
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        sizeBytes: 0,
        durationMs: 0,
        truncated: false,
        error: `Proxy error ${fetchResponse.status}: ${errText || fetchResponse.statusText}`,
        missingVariables,
      }
    }

    const text = await fetchResponse.text()
    const parsed = tryParseJson(text)
    if (!parsed.ok) {
      return {
        ok: false,
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        sizeBytes: 0,
        durationMs: 0,
        truncated: false,
        error: 'Proxy returned non-JSON response',
        missingVariables,
      }
    }

    return { ...(parsed.value as ProxyResponse), missingVariables }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return aborted()
    }
    return {
      ok: false,
      status: 0,
      statusText: '',
      headers: {},
      body: '',
      sizeBytes: 0,
      durationMs: 0,
      truncated: false,
      error: err instanceof Error ? err.message : 'Proxy unreachable',
      missingVariables,
    }
  }
}
