import { describe, it, expect } from 'vitest'
import { createTimingService } from '../timing.ts'
import { createMemoryStorageAdapter } from '../storage.ts'
import type { TimingEntry } from '../../shared/types.ts'

const makeEntry = (durationMs: number, status = 200): TimingEntry => ({
  at: Date.now(),
  durationMs,
  status,
})

describe('timingService', () => {
  it('returns empty history for unknown request', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    expect(svc.history('req-1')).toEqual([])
  })

  it('returns null stats for unknown request', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    expect(svc.stats('req-1')).toBeNull()
  })

  it('records an entry and retrieves history', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    const entry = makeEntry(123)
    svc.record('req-1', entry)
    expect(svc.history('req-1')).toEqual([entry])
  })

  it('keeps only the last 20 entries', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createTimingService(storage)
    for (let i = 0; i < 25; i++) {
      svc.record('req-1', makeEntry(i * 10))
    }
    const history = svc.history('req-1')
    expect(history).toHaveLength(20)
    // Should be the last 20 (indexes 5-24 with durationMs 50-240)
    expect(history[0].durationMs).toBe(50)
    expect(history[19].durationMs).toBe(240)
  })

  it('computes correct stats', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    svc.record('req-1', makeEntry(100))
    svc.record('req-1', makeEntry(200))
    svc.record('req-1', makeEntry(300))
    const stats = svc.stats('req-1')
    expect(stats).not.toBeNull()
    expect(stats!.count).toBe(3)
    expect(stats!.min).toBe(100)
    expect(stats!.max).toBe(300)
    expect(stats!.avg).toBe(200)
    expect(stats!.last).toBe(300)
  })

  it('clears history for a request', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    svc.record('req-1', makeEntry(100))
    svc.clear('req-1')
    expect(svc.history('req-1')).toEqual([])
    expect(svc.stats('req-1')).toBeNull()
  })

  it('clearing one request does not affect another', () => {
    const svc = createTimingService(createMemoryStorageAdapter())
    svc.record('req-1', makeEntry(100))
    svc.record('req-2', makeEntry(200))
    svc.clear('req-1')
    expect(svc.history('req-2')).toHaveLength(1)
  })

  it('persists across service recreations', () => {
    const storage = createMemoryStorageAdapter()
    const svc1 = createTimingService(storage)
    const entry = makeEntry(500)
    svc1.record('req-1', entry)

    const svc2 = createTimingService(storage)
    expect(svc2.history('req-1')).toEqual([entry])
  })
})
