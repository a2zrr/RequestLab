export function interpolate(
  text: string,
  vars: Record<string, string>,
): { text: string; missing: string[] } {
  const missing = new Set<string>()

  // Match {{name}} with optional surrounding spaces inside braces
  // Names: [A-Za-z0-9_.-]+
  const result = text.replace(/\{\{\s*([A-Za-z0-9_.:-]+)\s*\}\}/g, (match, name: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return vars[name]
    }
    missing.add(name)
    return match // leave untouched
  })

  return { text: result, missing: Array.from(missing) }
}

import type { Environment } from '../shared/types.ts'

export function envToVars(env: Environment | null): Record<string, string> {
  if (!env) return {}
  const result: Record<string, string> = {}
  for (const kv of env.variables) {
    if (kv.enabled && kv.key !== '') {
      result[kv.key] = kv.value
    }
  }
  return result
}
