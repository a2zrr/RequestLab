import { useSyncExternalStore } from 'react'

// Tracks the `dark` class on <html>, which the theme toggle controls.
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const isDark = () => document.documentElement.classList.contains('dark')

export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, isDark)
}
