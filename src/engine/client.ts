import * as Comlink from 'comlink'

import type { ConvertedImage, ConvertOptions, WorkerApi } from './types'

const RECYCLE_AFTER = 15

interface Slot {
  worker: Worker
  remote: Comlink.Remote<WorkerApi>
  jobs: number
}

/**
 * Desktop runs two workers; phones and low-core machines run one to keep
 * memory pressure from a 12 MP canvas predictable.
 */
export function defaultConcurrency(): number {
  if (typeof navigator === 'undefined') return 1
  const cores = navigator.hardwareConcurrency || 4
  const narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches
  return narrow || cores <= 4 ? 1 : 2
}

class ConversionPool {
  private readonly slots: Slot[] = []
  private readonly idle: Slot[] = []
  private readonly waiting: Array<(slot: Slot) => void> = []
  private readonly limit: number
  private disposed = false

  constructor(limit: number) {
    this.limit = Math.max(1, limit)
  }

  private spawn(): Slot {
    const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), {
      type: 'module',
    })
    return { worker, remote: Comlink.wrap<WorkerApi>(worker), jobs: 0 }
  }

  private acquire(): Promise<Slot> {
    const free = this.idle.shift()
    if (free) return Promise.resolve(free)

    if (this.slots.length < this.limit) {
      const slot = this.spawn()
      this.slots.push(slot)
      return Promise.resolve(slot)
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve)
    })
  }

  private release(slot: Slot): void {
    slot.jobs += 1

    if (slot.jobs >= RECYCLE_AFTER) {
      this.retire(slot)
      const next = this.waiting.shift()
      if (next && !this.disposed) {
        const fresh = this.spawn()
        this.slots.push(fresh)
        next(fresh)
      }
      return
    }

    const next = this.waiting.shift()
    if (next) {
      next(slot)
    } else {
      this.idle.push(slot)
    }
  }

  private retire(slot: Slot): void {
    slot.worker.terminate()
    const index = this.slots.indexOf(slot)
    if (index >= 0) this.slots.splice(index, 1)
  }

  async convert(
    file: File,
    options: ConvertOptions,
    onProgress: (value: number) => void,
  ): Promise<ConvertedImage> {
    const slot = await this.acquire()
    try {
      return await slot.remote.convert(file, options, Comlink.proxy(onProgress))
    } finally {
      this.release(slot)
    }
  }

  dispose(): void {
    this.disposed = true
    for (const slot of this.slots) slot.worker.terminate()
    this.slots.length = 0
    this.idle.length = 0
    this.waiting.length = 0
  }
}

let pool: ConversionPool | undefined

export function convertImage(
  file: File,
  options: ConvertOptions,
  onProgress: (value: number) => void,
): Promise<ConvertedImage> {
  pool ??= new ConversionPool(defaultConcurrency())
  return pool.convert(file, options, onProgress)
}

export function resetEngine(): void {
  pool?.dispose()
  pool = undefined
}
