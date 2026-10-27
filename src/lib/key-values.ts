import type { KeyValue } from '@/shared/types.ts'

export function countEnabled(rows: KeyValue[]): number {
  return rows.filter((r) => r.enabled && r.key.trim() !== '').length
}
