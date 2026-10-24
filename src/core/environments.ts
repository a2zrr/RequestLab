import type { Environment, KeyValue } from '../shared/types.ts'
import type { StorageAdapter } from './storage.ts'

const ENVS_KEY = 'environments'
const ACTIVE_KEY = 'activeEnvironmentId'

export function createEnvironmentsService(storage: StorageAdapter) {
  const load = (): Environment[] => storage.get<Environment[]>(ENVS_KEY) ?? []
  const save = (envs: Environment[]) => storage.set(ENVS_KEY, envs)

  return {
    list(): Environment[] {
      return load()
    },

    create(name: string): Environment {
      const envs = load()
      const env: Environment = { id: crypto.randomUUID(), name, variables: [] }
      save([...envs, env])
      return env
    },

    rename(id: string, name: string): void {
      save(load().map((e) => (e.id === id ? { ...e, name } : e)))
    },

    remove(id: string): void {
      save(load().filter((e) => e.id !== id))
      // Clear active if it was this one
      if (storage.get<string>(ACTIVE_KEY) === id) {
        storage.remove(ACTIVE_KEY)
      }
    },

    setVariables(id: string, variables: KeyValue[]): void {
      save(load().map((e) => (e.id === id ? { ...e, variables } : e)))
    },

    getActiveId(): string | null {
      return storage.get<string>(ACTIVE_KEY)
    },

    setActiveId(id: string | null): void {
      if (id === null) {
        storage.remove(ACTIVE_KEY)
      } else {
        storage.set(ACTIVE_KEY, id)
      }
    },
  }
}
