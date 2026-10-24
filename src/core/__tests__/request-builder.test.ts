import { describe, it, expect } from 'vitest'
import { buildProxyRequest, createEmptyRequest } from '../request-builder.ts'
import type { RequestDef } from '../../shared/types.ts'

describe('buildProxyRequest', () => {
  it('creates a valid empty request with createEmptyRequest', () => {
    const req = createEmptyRequest()
    expect(req.method).toBe('GET')
    expect(req.name).toBe('New Request')
    expect(req.bodyType).toBe('none')
    expect(req.id).toBeTruthy()
  })

  it('merges enabled params into query string', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      url: 'https://example.com/api',
      params: [
        { id: '1', key: 'foo', value: 'bar', enabled: true },
        { id: '2', key: 'baz', value: 'qux', enabled: true },
      ],
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.url).toContain('foo=bar')
    expect(proxyRequest.url).toContain('baz=qux')
  })

  it('ignores disabled rows and rows with empty keys', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      url: 'https://example.com',
      params: [
        { id: '1', key: 'visible', value: 'yes', enabled: true },
        { id: '2', key: 'hidden', value: 'no', enabled: false },
        { id: '3', key: '', value: 'empty-key', enabled: true },
      ],
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.url).toContain('visible=yes')
    expect(proxyRequest.url).not.toContain('hidden')
    expect(proxyRequest.url).not.toContain('empty-key')
  })

  it('preserves existing query string params', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      url: 'https://example.com?existing=1',
      params: [{ id: '1', key: 'new', value: '2', enabled: true }],
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.url).toContain('existing=1')
    expect(proxyRequest.url).toContain('new=2')
  })

  it('auto-adds Content-Type: application/json for bodyType json', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      method: 'POST',
      url: 'https://example.com',
      bodyType: 'json',
      body: '{"x":1}',
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.headers['Content-Type']).toBe('application/json')
  })

  it('does not override existing Content-Type (case-insensitive)', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      method: 'POST',
      url: 'https://example.com',
      bodyType: 'json',
      body: '{"x":1}',
      headers: [
        { id: '1', key: 'content-type', value: 'application/vnd.api+json', enabled: true },
      ],
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.headers['content-type']).toBe('application/vnd.api+json')
    expect(proxyRequest.headers['Content-Type']).toBeUndefined()
  })

  it('no body for bodyType none', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      url: 'https://example.com',
      bodyType: 'none',
      body: 'ignored',
    }
    const { proxyRequest } = buildProxyRequest(req)
    expect(proxyRequest.body).toBeUndefined()
  })

  it('applies variable interpolation to url, params, headers, body', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      method: 'POST',
      url: 'https://{{host}}/api',
      params: [{ id: '1', key: 'version', value: '{{ver}}', enabled: true }],
      headers: [{ id: '2', key: 'X-Token', value: '{{token}}', enabled: true }],
      bodyType: 'json',
      body: '{"env":"{{env}}"}',
    }
    const vars = { host: 'api.example.com', ver: 'v2', token: 'abc123', env: 'prod' }
    const { proxyRequest, missingVariables } = buildProxyRequest(req, vars)

    expect(proxyRequest.url).toContain('https://api.example.com/api')
    expect(proxyRequest.url).toContain('version=v2')
    expect(proxyRequest.headers['X-Token']).toBe('abc123')
    expect(proxyRequest.body).toBe('{"env":"prod"}')
    expect(missingVariables).toHaveLength(0)
  })

  it('reports missing variables', () => {
    const req: RequestDef = {
      ...createEmptyRequest(),
      url: 'https://{{missing_host}}/api',
      bodyType: 'none',
    }
    const { missingVariables } = buildProxyRequest(req, {})
    expect(missingVariables).toContain('missing_host')
  })
})
