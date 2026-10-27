import { createCollectionsService } from '@/core/collections.ts'
import { createEnvironmentsService } from '@/core/environments.ts'
import { createLocalStorageAdapter } from '@/core/storage.ts'
import { createTimingService } from '@/core/timing.ts'

const storage = createLocalStorageAdapter('requestlab')

export const collectionsService = createCollectionsService(storage)
export const environmentsService = createEnvironmentsService(storage)
export const timingService = createTimingService(storage)
