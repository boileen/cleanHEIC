import { create } from 'zustand'

import type { OutputFormat } from '@/app/routes'
import { buildPdf, pdfFilename } from '@/engine/pdf'
import type { PageSize } from '@/engine/pdf-layout'
import { convertFile, convertFormatFor, planOutputNames } from '@/engine/pipeline'

export const MAX_FILES = 30
export const MAX_TOTAL_BYTES = 150 * 1024 * 1024

export type QueueStatus = 'queued' | 'converting' | 'done' | 'error'

export interface QueueResult {
  name: string
  blob: Blob
  url: string
  size: number
  width: number
  height: number
  format: OutputFormat
}

export interface PdfPage {
  name: string
  blob: Blob
  previewUrl: string
  width: number
  height: number
  page: number
}

export interface PdfExport {
  name: string
  blob: Blob
  url: string
  size: number
  pages: number
}

export interface QueueItem {
  id: string
  file: File
  status: QueueStatus
  progress: number
  result?: QueueResult
  pdf?: PdfPage
  error?: string
}

export interface ConvertSettings {
  format: OutputFormat
  quality: number
  maxEdge: number | null
  pageSize: PageSize
}

interface QueueState {
  items: QueueItem[]
  isRunning: boolean
  pdfExport: PdfExport | null
  addFiles(incoming: FileList | File[]): string | null
  removeItem(id: string): void
  clear(): void
  resetResults(): void
  convertAll(settings: ConvertSettings): Promise<void>
}

let nextId = 0

function revokeItem(item: QueueItem): void {
  if (item.result) URL.revokeObjectURL(item.result.url)
  if (item.pdf) URL.revokeObjectURL(item.pdf.previewUrl)
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'This photo could not be converted.'
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  items: [],
  isRunning: false,
  pdfExport: null,

  addFiles(incoming) {
    const files = Array.from(incoming)
    const accepted = files.filter((file) => /\.heic$/i.test(file.name))
    const skipped = files.length - accepted.length

    let message: string | null =
      skipped > 0
        ? `${skipped} file${skipped === 1 ? '' : 's'} skipped — only .HEIC files are supported.`
        : null

    const next = [...get().items]
    for (const file of accepted) {
      if (next.length >= MAX_FILES) {
        message = `You can queue up to ${MAX_FILES} photos at a time.`
        break
      }
      const total = next.reduce((sum, item) => sum + item.file.size, 0)
      if (total + file.size > MAX_TOTAL_BYTES) {
        message = 'This batch exceeds the 150 MB limit. Convert it in smaller groups.'
        break
      }
      next.push({
        id: `photo-${(nextId += 1)}`,
        file,
        status: 'queued',
        progress: 0,
      })
    }

    // A document built from the previous queue no longer matches the batch.
    const previous = get().pdfExport
    if (previous) URL.revokeObjectURL(previous.url)

    set({ items: next, pdfExport: null })
    return message
  },

  removeItem(id) {
    if (get().isRunning) return
    const target = get().items.find((item) => item.id === id)
    if (target) revokeItem(target)

    const previous = get().pdfExport
    if (previous) URL.revokeObjectURL(previous.url)

    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      pdfExport: null,
    }))
  },

  clear() {
    if (get().isRunning) return
    for (const item of get().items) revokeItem(item)
    const previous = get().pdfExport
    if (previous) URL.revokeObjectURL(previous.url)
    set({ items: [], pdfExport: null })
  },

  resetResults() {
    if (get().isRunning) return
    for (const item of get().items) revokeItem(item)
    const previous = get().pdfExport
    if (previous) URL.revokeObjectURL(previous.url)
    set((state) => ({
      pdfExport: null,
      items: state.items.map((item) => ({
        ...item,
        status: 'queued',
        progress: 0,
        result: undefined,
        pdf: undefined,
        error: undefined,
      })),
    }))
  },

  async convertAll(settings) {
    const isPdf = settings.format === 'pdf'
    const format = isPdf ? 'jpeg' : convertFormatFor(settings.format)
    const { items, isRunning, pdfExport } = get()
    if (!format || isRunning || items.length === 0) return

    if (pdfExport) URL.revokeObjectURL(pdfExport.url)
    for (const item of items) revokeItem(item)

    const pending: QueueItem[] = items.map((item) => ({
      ...item,
      status: 'queued',
      progress: 0,
      result: undefined,
      pdf: undefined,
      error: undefined,
    }))
    const names = planOutputNames(pending, format)

    set({ items: pending, isRunning: true, pdfExport: null })

    const patch = (id: string, changes: Partial<QueueItem>) => {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      }))
    }

    const pages: Array<{ id: string; name: string; blob: Blob; width: number; height: number }> = []

    await Promise.all(
      pending.map(async (item) => {
        patch(item.id, { status: 'converting', progress: 0 })

        try {
          const result = await convertFile(
            {
              file: item.file,
              format,
              quality: settings.quality,
              maxEdge: settings.maxEdge,
            },
            names.get(item.id) ?? item.file.name,
            (value) => {
              const progress = isPdf ? value * 0.8 : value
              set((state) => ({
                items: state.items.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, progress: Math.max(entry.progress, progress) }
                    : entry,
                ),
              }))
            },
          )

          if (isPdf) {
            pages.push({
              id: item.id,
              name: result.name.replace(/\.[^.]+$/, '.pdf'),
              blob: result.blob,
              width: result.width,
              height: result.height,
            })

            patch(item.id, {
              status: 'converting',
              progress: 0.8,
              pdf: {
                name: result.name.replace(/\.[^.]+$/, '.pdf'),
                blob: result.blob,
                previewUrl: URL.createObjectURL(result.blob),
                width: result.width,
                height: result.height,
                page: 0,
              },
            })
          } else {
            patch(item.id, {
              status: 'done',
              progress: 1,
              result: {
                name: result.name,
                blob: result.blob,
                url: URL.createObjectURL(result.blob),
                size: result.blob.size,
                width: result.width,
                height: result.height,
                format: settings.format,
              },
            })
          }
        } catch (error) {
          patch(item.id, {
            status: 'error',
            progress: 0,
            error: errorMessage(error),
          })
        }
      }),
    )

    if (isPdf && pages.length > 0) {
      const order = new Map(pending.map((item, index) => [item.id, index]))
      pages.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

      try {
        const blob = await buildPdf(
          pages.map((page) => ({ blob: page.blob, width: page.width, height: page.height })),
          { pageSize: settings.pageSize },
        )
        const url = URL.createObjectURL(blob)
        const pageNumbers = new Map(pages.map((page, index) => [page.id, index + 1]))

        set((state) => ({
          pdfExport: {
            name: pdfFilename(),
            blob,
            url,
            size: blob.size,
            pages: pages.length,
          },
          items: state.items.map((item) => {
            const page = pageNumbers.get(item.id)
            if (!item.pdf || !page) return item
            return { ...item, status: 'done', progress: 1, pdf: { ...item.pdf, page } }
          }),
        }))
      } catch {
        const pageIds = new Set(pages.map((page) => page.id))
        set((state) => ({
          pdfExport: null,
          items: state.items.map((item) =>
            pageIds.has(item.id)
              ? { ...item, status: 'error', progress: 0, error: 'The PDF could not be assembled.' }
              : item,
          ),
        }))
      }
    }

    set({ isRunning: false })
  },
}))
