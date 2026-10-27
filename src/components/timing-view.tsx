import { useMemo } from 'react'
import { statusBadgeClass } from '@/lib/http-styles'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { timingService } from '@/store/services'

export function TimingView() {
  const requestId = useAppStore((s) => s.draft.id)
  const version = useAppStore((s) => s.timingVersion)

  const { stats, history } = useMemo(
    () => ({ stats: timingService.stats(requestId), history: timingService.history(requestId) }),
    // version invalidates the cached read after each recorded send
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestId, version],
  )

  if (!stats) {
    return <p className="p-3 text-sm text-muted-foreground">No timing data for this request yet.</p>
  }

  const maxMs = Math.max(...history.map((h) => h.durationMs), 1)
  const cells: [string, number][] = [
    ['Last', stats.last],
    ['Min', stats.min],
    ['Avg', stats.avg],
    ['Max', stats.max],
  ]

  return (
    <div className="flex flex-col gap-4 p-3">
      <dl className="grid grid-cols-4 gap-2">
        {cells.map(([label, ms]) => (
          <div key={label} className="rounded-lg border p-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-mono text-sm font-semibold">{Math.round(ms)} ms</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Last {history.length} durations</h3>
        <ol className="flex flex-col gap-1">
          {history.map((h) => (
            <li key={h.at} className="flex items-center gap-2 text-xs">
              <div className="h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className={cn('h-full rounded-sm', statusBadgeClass(h.status))}
                  style={{ width: `${(h.durationMs / maxMs) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono">{h.durationMs} ms</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
