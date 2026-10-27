import { useState } from 'react'
import { Moon, PanelLeft, Sun } from 'lucide-react'
import { EnvironmentsDialog } from '@/components/environments-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyTheme, getInitialTheme, type Theme } from '@/lib/theme'
import { useAppStore } from '@/store/app-store'

const NO_ENV = '__none__'

interface TopBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const environments = useAppStore((s) => s.environments)
  const activeId = useAppStore((s) => s.activeEnvironmentId)
  const setActive = useAppStore((s) => s.setActiveEnvironment)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [manageOpen, setManageOpen] = useState(false)

  const items = [
    { value: NO_ENV, label: 'No environment' },
    ...environments.map((e) => ({ value: e.id, label: e.name })),
  ]

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next, true)
    setTheme(next)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <PanelLeft />
      </Button>
      <h1 className="font-semibold tracking-tight">RequestLab</h1>
      <div className="ml-auto flex items-center gap-2">
        <Select
          items={items}
          value={activeId ?? NO_ENV}
          onValueChange={(v) => setActive(v === null || v === NO_ENV ? null : v)}
        >
          <SelectTrigger aria-label="Environment" className="w-40 sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setManageOpen(true)}>
          Manage
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
      <EnvironmentsDialog open={manageOpen} onOpenChange={setManageOpen} />
    </header>
  )
}
