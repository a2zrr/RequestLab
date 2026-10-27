export type Theme = 'light' | 'dark'

const KEY = 'requestlab:theme'

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage unavailable: fall back to system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme, persist = false): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  if (!persist) return
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Ignore storage errors.
  }
}
