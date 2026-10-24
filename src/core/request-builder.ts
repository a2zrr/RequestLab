import type { RequestDef, ProxyRequest } from '../shared/types.ts'
import { interpolate } from './variables.ts'

export function createEmptyRequest(): RequestDef {
  return {
    id: crypto.randomUUID(),
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    bodyType: 'none',
    body: '',
  }
}

export function buildProxyRequest(
  req: RequestDef,
  vars?: Record<string, string>,
): { proxyRequest: ProxyRequest; missingVariables: string[] } {
  const allMissing = new Set<string>()
  const applyVars = (s: string) => {
    if (!vars) return s
    const { text, missing } = interpolate(s, vars)
    missing.forEach((m) => allMissing.add(m))
    return text
  }

  // Interpolate URL
  let url = applyVars(req.url)

  // Build URL with params
  const enabledParams = req.params.filter((p) => p.enabled && p.key.trim() !== '')
  if (enabledParams.length > 0) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      // If URL is not absolute, treat the query string manually
      const [base, existing] = url.split('?')
      const sp = new URLSearchParams(existing ?? '')
      for (const p of enabledParams) {
        sp.append(applyVars(p.key), applyVars(p.value))
      }
      url = `${base}?${sp.toString()}`
      parsedUrl = null as unknown as URL
    }

    if (parsedUrl !== null) {
      for (const p of enabledParams) {
        parsedUrl.searchParams.append(applyVars(p.key), applyVars(p.value))
      }
      url = parsedUrl.toString()
    }
  }

  // Build headers (only enabled, non-empty key)
  const headers: Record<string, string> = {}
  for (const h of req.headers) {
    if (h.enabled && h.key.trim() !== '') {
      headers[applyVars(h.key)] = applyVars(h.value)
    }
  }

  // Auto-add Content-Type for JSON if none present (case-insensitive)
  if (req.bodyType === 'json') {
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === 'content-type',
    )
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json'
    }
  }

  // Build body
  let body: string | undefined
  if (req.bodyType === 'none') {
    body = undefined
  } else {
    body = applyVars(req.body)
  }

  const proxyRequest: ProxyRequest = {
    method: req.method,
    url,
    headers,
    ...(body !== undefined ? { body } : {}),
  }

  return { proxyRequest, missingVariables: Array.from(allMissing) }
}
