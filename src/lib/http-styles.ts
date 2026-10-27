import { statusCategory } from '@/core/request-engine.ts'
import type { HttpMethod } from '@/shared/types.ts'

export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE']

export const methodTextClass: Record<HttpMethod, string> = {
  GET: 'text-green-600 dark:text-green-400',
  POST: 'text-amber-600 dark:text-amber-400',
  PUT: 'text-blue-600 dark:text-blue-400',
  DELETE: 'text-red-600 dark:text-red-400',
}

const statusClasses: Record<ReturnType<typeof statusCategory>, string> = {
  success: 'bg-green-600 text-white dark:bg-green-500',
  redirect: 'bg-blue-600 text-white dark:bg-blue-500',
  'client-error': 'bg-amber-500 text-black',
  'server-error': 'bg-red-600 text-white dark:bg-red-500',
  'network-error': 'bg-muted-foreground text-background',
}

export function statusBadgeClass(status: number): string {
  return statusClasses[statusCategory(status)]
}
