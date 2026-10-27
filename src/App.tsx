import { useEffect, useState } from 'react'
import { RequestEditor } from '@/components/request-editor'
import { ResponsePanel } from '@/components/response-panel'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { cn } from '@/lib/utils'

const WIDE_QUERY = '(min-width: 768px)'

export function App() {
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE_QUERY).matches)
  const [sidebarOpen, setSidebarOpen] = useState(isWide)

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY)
    const onChange = () => {
      setIsWide(mq.matches)
      setSidebarOpen(mq.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && !isWide && (
          <div aria-hidden className="absolute inset-0 z-10 bg-black/30" onClick={() => setSidebarOpen(false)} />
        )}
        {sidebarOpen && (
          <aside
            className={cn(
              'w-[280px] shrink-0 border-r bg-background',
              !isWide && 'absolute inset-y-0 left-0 z-20 shadow-lg',
            )}
          >
            <Sidebar />
          </aside>
        )}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 basis-1/2 overflow-auto">
            <RequestEditor />
          </div>
          <div className="min-h-0 basis-1/2 overflow-auto border-t">
            <ResponsePanel />
          </div>
        </main>
      </div>
    </div>
  )
}
