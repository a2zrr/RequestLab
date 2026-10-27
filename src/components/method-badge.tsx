import { methodTextClass } from '@/lib/http-styles'
import { cn } from '@/lib/utils'
import type { HttpMethod } from '@/shared/types.ts'

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  return (
    <span className={cn('w-12 shrink-0 font-mono text-[11px] font-bold', methodTextClass[method], className)}>
      {method === 'DELETE' ? 'DEL' : method}
    </span>
  )
}
