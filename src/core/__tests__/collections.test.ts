import { describe, it, expect } from 'vitest'
import { createCollectionsService } from '../collections.ts'
import { createMemoryStorageAdapter } from '../storage.ts'
import { createEmptyRequest } from '../request-builder.ts'

describe('collectionsService', () => {
  it('starts with empty list', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    expect(svc.list()).toEqual([])
  })

  it('creates a collection', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('My API')
    expect(col.name).toBe('My API')
    expect(col.requests).toEqual([])
    expect(svc.list()).toHaveLength(1)
  })

  it('renames a collection', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('Old Name')
    svc.renameCollection(col.id, 'New Name')
    expect(svc.list()[0].name).toBe('New Name')
  })

  it('deletes a collection', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('ToDelete')
    svc.deleteCollection(col.id)
    expect(svc.list()).toHaveLength(0)
  })

  it('saves a new request into a collection', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('API')
    const req = createEmptyRequest()
    svc.saveRequest(col.id, req)
    expect(svc.list()[0].requests).toHaveLength(1)
    expect(svc.list()[0].requests[0].id).toBe(req.id)
  })

  it('updates an existing request (same id)', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('API')
    const req = createEmptyRequest()
    svc.saveRequest(col.id, req)
    const updated = { ...req, name: 'Updated' }
    svc.saveRequest(col.id, updated)
    const requests = svc.list()[0].requests
    expect(requests).toHaveLength(1)
    expect(requests[0].name).toBe('Updated')
  })

  it('deletes a request', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('API')
    const req = createEmptyRequest()
    svc.saveRequest(col.id, req)
    svc.deleteRequest(col.id, req.id)
    expect(svc.list()[0].requests).toHaveLength(0)
  })

  it('duplicates a request with new id and " copy" suffix', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createCollectionsService(storage)
    const col = svc.createCollection('API')
    const req = { ...createEmptyRequest(), name: 'GetUsers' }
    svc.saveRequest(col.id, req)
    const copy = svc.duplicateRequest(col.id, req.id)
    expect(copy.name).toBe('GetUsers copy')
    expect(copy.id).not.toBe(req.id)
    expect(svc.list()[0].requests).toHaveLength(2)
  })

  it('persists across service recreations (same storage adapter)', () => {
    const storage = createMemoryStorageAdapter()
    const svc1 = createCollectionsService(storage)
    const col = svc1.createCollection('Persist Test')
    const req = createEmptyRequest()
    svc1.saveRequest(col.id, req)

    // Recreate the service with the same storage
    const svc2 = createCollectionsService(storage)
    expect(svc2.list()).toHaveLength(1)
    expect(svc2.list()[0].requests).toHaveLength(1)
  })
})
