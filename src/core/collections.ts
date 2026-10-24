import type { Collection, RequestDef } from '../shared/types.ts'
import type { StorageAdapter } from './storage.ts'

const STORAGE_KEY = 'collections'

export function createCollectionsService(storage: StorageAdapter) {
  const load = (): Collection[] => storage.get<Collection[]>(STORAGE_KEY) ?? []
  const save = (cols: Collection[]) => storage.set(STORAGE_KEY, cols)

  return {
    list(): Collection[] {
      return load()
    },

    createCollection(name: string): Collection {
      const cols = load()
      const col: Collection = { id: crypto.randomUUID(), name, requests: [] }
      save([...cols, col])
      return col
    },

    renameCollection(id: string, name: string): void {
      const cols = load().map((c) => (c.id === id ? { ...c, name } : c))
      save(cols)
    },

    deleteCollection(id: string): void {
      save(load().filter((c) => c.id !== id))
    },

    saveRequest(collectionId: string, req: RequestDef): void {
      const cols = load().map((c) => {
        if (c.id !== collectionId) return c
        const idx = c.requests.findIndex((r) => r.id === req.id)
        const requests =
          idx === -1
            ? [...c.requests, req]
            : c.requests.map((r) => (r.id === req.id ? req : r))
        return { ...c, requests }
      })
      save(cols)
    },

    deleteRequest(collectionId: string, requestId: string): void {
      const cols = load().map((c) => {
        if (c.id !== collectionId) return c
        return { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
      })
      save(cols)
    },

    duplicateRequest(collectionId: string, requestId: string): RequestDef {
      const cols = load()
      const col = cols.find((c) => c.id === collectionId)
      if (!col) throw new Error(`Collection ${collectionId} not found`)
      const original = col.requests.find((r) => r.id === requestId)
      if (!original) throw new Error(`Request ${requestId} not found`)

      const copy: RequestDef = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} copy`,
        params: original.params.map((p) => ({ ...p, id: crypto.randomUUID() })),
        headers: original.headers.map((h) => ({ ...h, id: crypto.randomUUID() })),
      }

      const updated = cols.map((c) => {
        if (c.id !== collectionId) return c
        return { ...c, requests: [...c.requests, copy] }
      })
      save(updated)
      return copy
    },
  }
}
