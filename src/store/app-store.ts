import { create } from 'zustand'
import { createEmptyRequest } from '@/core/request-builder.ts'
import { sendRequest } from '@/core/request-engine.ts'
import { envToVars } from '@/core/variables.ts'
import type { Collection, Environment, KeyValue, RequestDef } from '@/shared/types.ts'
import { collectionsService, environmentsService, timingService } from './services.ts'

export type SendResult = Awaited<ReturnType<typeof sendRequest>>
export type ResponseStatus = 'idle' | 'loading' | 'done'

interface AppState {
  collections: Collection[]
  environments: Environment[]
  activeEnvironmentId: string | null
  draft: RequestDef
  draftCollectionId: string | null
  dirty: boolean
  responseStatus: ResponseStatus
  result: SendResult | null
  abortController: AbortController | null
  // Bumped after each recorded timing so views re-read the timing service.
  timingVersion: number

  updateDraft: (patch: Partial<Omit<RequestDef, 'id'>>) => void
  newRequest: () => void
  openRequest: (collectionId: string, requestId: string) => void
  saveDraft: (collectionId?: string) => void
  saveDraftToNewCollection: (name: string) => void
  send: () => Promise<void>
  cancel: () => void

  createCollection: (name: string) => void
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  duplicateRequest: (collectionId: string, requestId: string) => void
  deleteRequest: (collectionId: string, requestId: string) => void

  setActiveEnvironment: (id: string | null) => void
  createEnvironment: (name: string) => Environment
  renameEnvironment: (id: string, name: string) => void
  deleteEnvironment: (id: string) => void
  setEnvironmentVariables: (id: string, variables: KeyValue[]) => void
}

function initialActiveEnvironmentId(envs: Environment[]): string | null {
  const id = environmentsService.getActiveId()
  return id !== null && envs.some((e) => e.id === id) ? id : null
}

const initialEnvironments = environmentsService.list()

export const useAppStore = create<AppState>()((set, get) => ({
  collections: collectionsService.list(),
  environments: initialEnvironments,
  activeEnvironmentId: initialActiveEnvironmentId(initialEnvironments),
  draft: createEmptyRequest(),
  draftCollectionId: null,
  dirty: false,
  responseStatus: 'idle',
  result: null,
  abortController: null,
  timingVersion: 0,

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch }, dirty: true })),

  newRequest: () => {
    get().abortController?.abort()
    set({
      draft: createEmptyRequest(),
      draftCollectionId: null,
      dirty: false,
      responseStatus: 'idle',
      result: null,
      abortController: null,
    })
  },

  openRequest: (collectionId, requestId) => {
    const req = get()
      .collections.find((c) => c.id === collectionId)
      ?.requests.find((r) => r.id === requestId)
    if (!req) return
    get().abortController?.abort()
    set({
      draft: req,
      draftCollectionId: collectionId,
      dirty: false,
      responseStatus: 'idle',
      result: null,
      abortController: null,
    })
  },

  saveDraft: (collectionId) => {
    const target = collectionId ?? get().draftCollectionId
    if (!target) return
    collectionsService.saveRequest(target, get().draft)
    set({ collections: collectionsService.list(), draftCollectionId: target, dirty: false })
  },

  saveDraftToNewCollection: (name) => {
    const col = collectionsService.createCollection(name)
    get().saveDraft(col.id)
  },

  send: async () => {
    const { draft, environments, activeEnvironmentId, abortController } = get()
    abortController?.abort()
    const controller = new AbortController()
    set({ responseStatus: 'loading', abortController: controller })

    const env = environments.find((e) => e.id === activeEnvironmentId) ?? null
    const result = await sendRequest(draft, { signal: controller.signal, vars: envToVars(env) })

    // A newer send, cancel or request switch has taken over.
    if (get().abortController !== controller) return

    if (!result.error) {
      timingService.record(draft.id, {
        at: Date.now(),
        durationMs: result.durationMs,
        status: result.status,
      })
    }
    set((s) => ({
      responseStatus: 'done',
      result,
      abortController: null,
      timingVersion: result.error ? s.timingVersion : s.timingVersion + 1,
    }))
  },

  cancel: () => {
    get().abortController?.abort()
  },

  createCollection: (name) => {
    collectionsService.createCollection(name)
    set({ collections: collectionsService.list() })
  },

  renameCollection: (id, name) => {
    collectionsService.renameCollection(id, name)
    set({ collections: collectionsService.list() })
  },

  deleteCollection: (id) => {
    collectionsService.deleteCollection(id)
    const detached = get().draftCollectionId === id
    set((s) => ({
      collections: collectionsService.list(),
      draftCollectionId: detached ? null : s.draftCollectionId,
      dirty: detached ? true : s.dirty,
    }))
  },

  duplicateRequest: (collectionId, requestId) => {
    collectionsService.duplicateRequest(collectionId, requestId)
    set({ collections: collectionsService.list() })
  },

  deleteRequest: (collectionId, requestId) => {
    collectionsService.deleteRequest(collectionId, requestId)
    const detached = get().draft.id === requestId
    set((s) => ({
      collections: collectionsService.list(),
      draftCollectionId: detached ? null : s.draftCollectionId,
      dirty: detached ? true : s.dirty,
    }))
  },

  setActiveEnvironment: (id) => {
    environmentsService.setActiveId(id)
    set({ activeEnvironmentId: id })
  },

  createEnvironment: (name) => {
    const env = environmentsService.create(name)
    set({ environments: environmentsService.list() })
    return env
  },

  renameEnvironment: (id, name) => {
    environmentsService.rename(id, name)
    set({ environments: environmentsService.list() })
  },

  deleteEnvironment: (id) => {
    environmentsService.remove(id)
    set((s) => ({
      environments: environmentsService.list(),
      activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
    }))
  },

  setEnvironmentVariables: (id, variables) => {
    environmentsService.setVariables(id, variables)
    set({ environments: environmentsService.list() })
  },
}))
