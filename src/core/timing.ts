import type { TimingEntry } from '../shared/types.ts'
import type { StorageAdapter } from './storage.ts'

const STORAGE_KEY = 'timing'
const MAX_HISTORY = 20

type TimingStore = Record<string, TimingEntry[]>

export function createTimingService(storage: StorageAdapter) {
  const load = (): TimingStore => storage.get<TimingStore>(STORAGE_KEY) ?? {}
  const save = (store: TimingStore) => storage.set(STORAGE_KEY, store)

  return {
    record(requestId: string, entry: TimingEntry): void {
      const store = load()
      const existing = store[requestId] ?? []
      // Keep only the last 20 entries
      const updated = [...existing, entry].slice(-MAX_HISTORY)
      save({ ...store, [requestId]: updated })
    },

    history(requestId: string): TimingEntry[] {
      return load()[requestId] ?? []
    },

    stats(
      requestId: string,
    ): { count: number; min: number; max: number; avg: number; last: number } | null {
      const entries = load()[requestId]
      if (!entries || entries.length === 0) return null

      const durations = entries.map((e) => e.durationMs)
      const count = durations.length
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      const avg = durations.reduce((a, b) => a + b, 0) / count
      const last = durations[durations.length - 1]

      return { count, min, max, avg, last }
    },

    clear(requestId: string): void {
      const store = load()
      const { [requestId]: _, ...rest } = store
      save(rest)
    },
  }
}
