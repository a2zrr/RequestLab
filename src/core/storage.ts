export interface StorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
}

export function createLocalStorageAdapter(prefix = ''): StorageAdapter {
  const fullKey = (key: string) => (prefix ? `${prefix}:${key}` : key)

  return {
    get<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(fullKey(key))
        if (raw === null) return null
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },

    set<T>(key: string, value: T): void {
      try {
        localStorage.setItem(fullKey(key), JSON.stringify(value))
      } catch {
        // Silently ignore storage errors (e.g. quota exceeded)
      }
    },

    remove(key: string): void {
      try {
        localStorage.removeItem(fullKey(key))
      } catch {
        // Silently ignore
      }
    },
  }
}

export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>()

  return {
    get<T>(key: string): T | null {
      const raw = store.get(key)
      if (raw === undefined) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },

    set<T>(key: string, value: T): void {
      store.set(key, JSON.stringify(value))
    },

    remove(key: string): void {
      store.delete(key)
    },
  }
}
