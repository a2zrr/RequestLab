import { describe, it, expect } from 'vitest'
import { interpolate, envToVars } from '../variables.ts'
import type { Environment } from '../../shared/types.ts'

describe('interpolate', () => {
  it('replaces simple {{name}}', () => {
    const { text, missing } = interpolate('Hello {{name}}!', { name: 'World' })
    expect(text).toBe('Hello World!')
    expect(missing).toHaveLength(0)
  })

  it('handles spaces inside {{ name }}', () => {
    const { text } = interpolate('Hello {{ name }}!', { name: 'World' })
    expect(text).toBe('Hello World!')
  })

  it('handles extra spaces on both sides', () => {
    const { text } = interpolate('{{  user  }}', { user: 'alice' })
    expect(text).toBe('alice')
  })

  it('leaves unknown names untouched', () => {
    const { text, missing } = interpolate('Hello {{unknown}}!', {})
    expect(text).toBe('Hello {{unknown}}!')
    expect(missing).toContain('unknown')
  })

  it('lists duplicates only once', () => {
    const { missing } = interpolate('{{x}} and {{x}} again', {})
    expect(missing.filter((m) => m === 'x')).toHaveLength(1)
  })

  it('handles multiple variables', () => {
    const { text, missing } = interpolate('{{a}}-{{b}}-{{c}}', { a: '1', c: '3' })
    expect(text).toBe('1-{{b}}-3')
    expect(missing).toEqual(['b'])
  })

  it('handles names with dots and underscores', () => {
    const { text } = interpolate('{{base.url}}/{{api_version}}', {
      'base.url': 'https://example.com',
      api_version: 'v1',
    })
    expect(text).toBe('https://example.com/v1')
  })

  it('handles empty string', () => {
    const { text, missing } = interpolate('', {})
    expect(text).toBe('')
    expect(missing).toHaveLength(0)
  })

  it('returns no missing for text without variables', () => {
    const { missing } = interpolate('no vars here', { x: '1' })
    expect(missing).toHaveLength(0)
  })
})

describe('envToVars', () => {
  it('returns empty object for null env', () => {
    expect(envToVars(null)).toEqual({})
  })

  it('includes only enabled variables', () => {
    const env: Environment = {
      id: '1',
      name: 'Test',
      variables: [
        { id: 'a', key: 'host', value: 'example.com', enabled: true },
        { id: 'b', key: 'secret', value: 'hidden', enabled: false },
      ],
    }
    const vars = envToVars(env)
    expect(vars['host']).toBe('example.com')
    expect(vars['secret']).toBeUndefined()
  })

  it('skips variables with empty keys', () => {
    const env: Environment = {
      id: '1',
      name: 'Test',
      variables: [{ id: 'a', key: '', value: 'val', enabled: true }],
    }
    expect(envToVars(env)).toEqual({})
  })
})
