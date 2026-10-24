import { describe, it, expect } from 'vitest'
import { createEnvironmentsService } from '../environments.ts'
import { createMemoryStorageAdapter } from '../storage.ts'

describe('environmentsService', () => {
  it('starts with empty list and null active id', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    expect(svc.list()).toEqual([])
    expect(svc.getActiveId()).toBeNull()
  })

  it('creates an environment', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Production')
    expect(env.name).toBe('Production')
    expect(env.variables).toEqual([])
    expect(svc.list()).toHaveLength(1)
  })

  it('renames an environment', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Old')
    svc.rename(env.id, 'New')
    expect(svc.list()[0].name).toBe('New')
  })

  it('removes an environment', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Temp')
    svc.remove(env.id)
    expect(svc.list()).toHaveLength(0)
  })

  it('sets variables on an environment', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Dev')
    const vars = [{ id: '1', key: 'host', value: 'localhost', enabled: true }]
    svc.setVariables(env.id, vars)
    expect(svc.list()[0].variables).toEqual(vars)
  })

  it('sets and gets active environment id', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Staging')
    svc.setActiveId(env.id)
    expect(svc.getActiveId()).toBe(env.id)
  })

  it('clears active id when set to null', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('Staging')
    svc.setActiveId(env.id)
    svc.setActiveId(null)
    expect(svc.getActiveId()).toBeNull()
  })

  it('clears active id when active environment is removed', () => {
    const storage = createMemoryStorageAdapter()
    const svc = createEnvironmentsService(storage)
    const env = svc.create('ToRemove')
    svc.setActiveId(env.id)
    svc.remove(env.id)
    expect(svc.getActiveId()).toBeNull()
  })

  it('persists across service recreations', () => {
    const storage = createMemoryStorageAdapter()
    const svc1 = createEnvironmentsService(storage)
    const env = svc1.create('Prod')
    svc1.setActiveId(env.id)

    const svc2 = createEnvironmentsService(storage)
    expect(svc2.list()).toHaveLength(1)
    expect(svc2.getActiveId()).toBe(env.id)
  })
})
