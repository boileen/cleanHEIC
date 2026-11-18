import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatLabels, formatRoutes, type ConverterRoute, type OutputFormat } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { downloadBlob } from '@/engine/download'
import { buildPdf } from '@/engine/pdf'
import type { PageSize } from '@/engine/pdf-layout'
import { createZip, zipFilename } from '@/engine/zip'
import { formatBytes } from '@/lib/format'
import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  useQueueStore,
  type QueueItem,
  type QueueResult,
  type QueueStatus,
} from '@/store/queue'

const FORMATS: OutputFormat[] = ['jpg', 'png', 'webp', 'pdf']
const MAX_TOTAL_MB = Math.round(MAX_TOTAL_BYTES / (1024 * 1024))

const resizeOptions = [
  { value: 'original', label: 'Original (Native HEIC)' },
  { value: '1920', label: 'Max 1920px — Full HD web' },
  { value: '1280', label: 'Max 1280px — Email & social' },
  { value: '800', label: 'Max 800px — Compact' },
]

const uploadTrust = ['100% free', 'No installation', 'Files stay in this tab']

const statusStyles: Record<QueueStatus, string> = {
  queued: 'bg-surface text-ink-muted',
  converting: 'bg-primary-soft text-primary',
  done: 'bg-success/10 text-success',
  error: 'bg-danger/10 text-danger',
}

const statusLabels: Record<QueueStatus, string> = {
  queued: 'Queued',
  converting: 'Converting',
  done: 'Done',
  error: 'Failed',
}

type DoneItem = QueueItem & { result: QueueResult }

function defaultQuality(format: OutputFormat): number {
  if (format === 'png') return 100
  if (format === 'webp') return 80
  return 85
}

function qualityLabel(value: number): string {
  if (value < 70) return 'Smaller file'
  if (value < 90) return 'Balanced'
  if (value < 100) return 'High quality'
  return 'Maximum'
}

function savedLabel(originalSize: number, newSize: number): string {
  if (originalSize <= 0) return ''
  const saved = Math.round((1 - newSize / originalSize) * 100)
  return saved >= 0 ? `−${saved}%` : `+${Math.abs(saved)}%`
}

function isSettled(item: QueueItem): boolean {
  return item.status === 'done' || item.status === 'error'
}

export function Workspace({ route }: { route: ConverterRoute }) {
  const items = useQueueStore((state) => state.items)
  const isRunning = useQueueStore((state) => state.isRunning)
  const addFiles = useQueueStore((state) => state.addFiles)
  const removeItem = useQueueStore((state) => state.removeItem)
  const clear = useQueueStore((state) => state.clear)
  const resetResults = useQueueStore((state) => state.resetResults)
  const convertAll = useQueueStore((state) => state.convertAll)
  const pdfExport = useQueueStore((state) => state.pdfExport)

  const [isDragging, setIsDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [zipBusy, setZipBusy] = useState(false)
  const [pdfPageBusy, setPdfPageBusy] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [qualityByFormat, setQualityByFormat] = useState<Record<OutputFormat, number>>(() => ({
    jpg: defaultQuality('jpg'),
    png: defaultQuality('png'),
    webp: defaultQuality('webp'),
    pdf: defaultQuality('pdf'),
  }))
  const [maxEdge, setMaxEdge] = useState('original')

  const activeFormat = route.defaultFormat
  const isLossless = activeFormat === 'png'
  const isPdf = activeFormat === 'pdf'
  const quality = qualityByFormat[activeFormat]

  useEffect(() => {
    resetResults()
  }, [activeFormat, resetResults])

  const handleFiles = (incoming: FileList | File[]) => {
    setNotice(addFiles(incoming))
  }

  const remove = (id: string) => {
    removeItem(id)
    setNotice(null)
  }

  const resetOptions = () => {
    setQualityByFormat((current) => ({ ...current, [activeFormat]: defaultQuality(activeFormat) }))
    setMaxEdge('original')
  }

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0)
  const doneItems = items.filter(
    (item): item is DoneItem =>
      Boolean(item.result) && item.result?.format === activeFormat,
  )
  const doneOriginalBytes = doneItems.reduce((sum, item) => sum + item.file.size, 0)
  const doneResultBytes = doneItems.reduce((sum, item) => sum + item.result.size, 0)
  const settledCount = items.filter(isSettled).length
  const pdfPages = items.filter((item) => item.pdf && item.pdf.page > 0)
  const pdfInputBytes = pdfPages.reduce((sum, item) => sum + item.file.size, 0)
  const isAssemblingPdf = isPdf && items.some((item) => item.pdf && item.pdf.page === 0)

  const convert = () => {
    setNotice(null)
    void convertAll({
      format: activeFormat,
      quality: isLossless ? 100 : quality,
      maxEdge: maxEdge === 'original' ? null : Number(maxEdge),
      pageSize,
    })
  }

  const downloadDocument = () => {
    if (pdfExport) downloadBlob(pdfExport.blob, pdfExport.name)
  }

  const downloadPage = async (item: QueueItem) => {
    if (!item.pdf || pdfPageBusy) return
    setPdfPageBusy(item.id)
    setNotice(null)
    try {
      const blob = await buildPdf(
        [{ blob: item.pdf.blob, width: item.pdf.width, height: item.pdf.height }],
        { pageSize },
      )
      downloadBlob(blob, item.pdf.name)
    } catch {
      setNotice('Could not build that PDF page. Download the full document instead.')
    } finally {
      setPdfPageBusy(null)
    }
  }

  const downloadAll = async () => {
    if (doneItems.length === 0 || zipBusy) return
    setZipBusy(true)
    setNotice(null)
    try {
      const archive = await createZip(
        doneItems.map((item) => ({ name: item.result.name, blob: item.result.blob })),
      )
      downloadBlob(archive, zipFilename(activeFormat))
    } catch {
      setNotice('Could not build the ZIP archive. Download the photos individually instead.')
    } finally {
      setZipBusy(false)
    }
  }

  return (
    <section id="workspace" className="mb-16 w-full px-4">
      <div className="mx-auto max-w-workspace">
        <div className="rounded-2xl border border-line bg-surface shadow-raised">
          <div className="p-4 sm:p-5">
            <div className="rounded-xl bg-canvas p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Target format
                </span>
                <div
                  className="inline-flex gap-1 rounded-lg bg-surface p-1 shadow-sm"
                  role="group"
                  aria-label="Output format"
                >
                  {FORMATS.map((format) => {
                    const isActive = format === activeFormat
                    const isLocked = isRunning && !isActive
                    return (
                      <Link
                        key={format}
                        to={formatRoutes[format]}
                        aria-current={isActive ? 'page' : undefined}
                        aria-disabled={isLocked || undefined}
                        tabIndex={isLocked ? -1 : undefined}
                        onClick={(event) => {
                          if (isLocked) event.preventDefault()
                        }}
                        className={`rounded-md px-3.5 py-1.5 text-control transition-colors ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-ink-secondary hover:text-ink'
                        } ${isLocked ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        {formatLabels[format]}
                      </Link>
                    )
                  })}
                </div>

                <div className="ml-auto w-full max-w-sm flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="quality" className="text-control text-ink">
                      Output quality
                    </label>
                    <span className="font-mono text-mono-metric font-semibold text-primary">
                      {isLossless ? 'Lossless' : `${quality}% (${qualityLabel(quality)})`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-ink-muted">10%</span>
                    <input
                      id="quality"
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={isLossless ? 100 : quality}
                      disabled={isLossless || isRunning}
                      onChange={(event) =>
                        setQualityByFormat((current) => ({
                          ...current,
                          [activeFormat]: Number(event.target.value),
                        }))
                      }
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                      aria-describedby="quality-help"
                    />
                    <span className="font-mono text-[10px] text-ink-muted">100%</span>
                  </div>
                  <p id="quality-help" className="mt-1.5 text-[11px] leading-4 text-ink-muted">
                    {isLossless
                      ? 'PNG is always lossless.'
                      : isPdf
                        ? 'JPEG quality inside the PDF.'
                        : '85% is a good balance for photos.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="resize" className="whitespace-nowrap text-control text-ink-secondary">
                    Resolution
                  </label>
                  <select
                    id="resize"
                    value={maxEdge}
                    disabled={isRunning}
                    onChange={(event) => setMaxEdge(event.target.value)}
                    className="rounded-md border border-line bg-surface px-2.5 py-1 text-control text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isPdf ? (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="page-size"
                      className="whitespace-nowrap text-control text-ink-secondary"
                    >
                      Page size
                    </label>
                    <select
                      id="page-size"
                      value={pageSize}
                      disabled={isRunning}
                      onChange={(event) => setPageSize(event.target.value as PageSize)}
                      className="rounded-md border border-line bg-surface px-2.5 py-1 text-control text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="a4">A4 — 210 × 297 mm</option>
                      <option value="letter">US Letter — 8.5 × 11 in</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                handleFiles(event.dataTransfer.files)
              }}
              className={`group mt-5 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all sm:py-12 focus-within:ring-2 focus-within:ring-primary/40 ${
                isDragging
                  ? 'border-primary bg-primary-soft/70 ring-4 ring-primary/10'
                  : 'border-line bg-canvas/60 hover:border-primary/40 hover:bg-primary-soft/25'
              }`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary shadow-sm transition-transform group-hover:scale-105">
                <Icon name="upload" className="h-7 w-7" />
              </span>

              <span className="flex flex-col gap-1.5">
                <span className="block text-lg font-bold tracking-tight text-ink">
                  Drag your HEIC photos here
                </span>
                <span className="block text-xs text-ink-muted">
                  Up to {MAX_FILES} images · Max total {MAX_TOTAL_MB} MB
                </span>
              </span>

              <span className="flex w-full max-w-[15rem] items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  or
                </span>
                <span className="h-px flex-1 bg-line" />
              </span>

              <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:bg-primary-hover">
                <Icon name="image-plus" className="h-4 w-4" />
                Upload photos
              </span>

              <input
                type="file"
                accept=".heic,image/heic"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) handleFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>

            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-secondary">
              {uploadTrust.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Icon name="check-circle" className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 px-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h4 className="text-base font-semibold text-ink">
                Batch queue{' '}
                <span className="font-mono text-xs font-normal text-ink-muted">
                  ({items.length} of {MAX_FILES})
                </span>
              </h4>

              {isRunning ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-primary">
                  <Icon name="loader" className="h-3.5 w-3.5 animate-spin" />
                  {isAssemblingPdf
                    ? 'Building PDF…'
                    : `Converting ${settledCount} of ${items.length}`}
                </span>
              ) : pdfExport ? (
                <span className="font-mono text-[11px] text-ink-muted">
                  {pdfExport.pages} page{pdfExport.pages === 1 ? '' : 's'} ·{' '}
                  {formatBytes(pdfInputBytes)} → {formatBytes(pdfExport.size)}
                </span>
              ) : doneItems.length > 0 ? (
                <span className="font-mono text-[11px] text-ink-muted">
                  {doneItems.length} of {items.length} converted ·{' '}
                  {formatBytes(doneOriginalBytes)} → {formatBytes(doneResultBytes)}
                </span>
              ) : null}
            </div>

            {notice ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger"
              >
                {notice}
              </p>
            ) : null}

            {items.length === 0 ? (
              <p className="mt-2 pb-1 text-body-md text-ink-muted">
                No photos yet — drop files above to build your batch.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {items.map((item) => {
                  const result =
                    item.result?.format === activeFormat ? item.result : undefined
                  const pdfPage = isPdf ? item.pdf : undefined
                  const previewUrl = result?.url ?? pdfPage?.previewUrl
                  const status: QueueStatus = result || pdfPage
                    ? item.status
                    : item.status === 'done'
                      ? 'queued'
                      : item.status
                  const percent = Math.round(item.progress * 100)
                  return (
                    <li key={item.id} className="rounded-xl bg-canvas p-3.5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt=""
                              width={48}
                              height={48}
                              className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface text-ink-secondary shadow-sm">
                              <Icon name="file" className="h-5 w-5" />
                            </span>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="truncate text-control text-ink">{item.file.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${statusStyles[status]}`}
                              >
                                {status === 'converting'
                                  ? `${statusLabels[status]} ${percent}%`
                                  : statusLabels[status]}
                              </span>
                            </div>

                            {result ? (
                              <p className="font-mono text-mono-caption text-ink-muted">
                                {result.width}×{result.height} · {formatBytes(item.file.size)} →{' '}
                                {formatBytes(result.size)} ·{' '}
                                <span
                                  className={
                                    result.size <= item.file.size
                                      ? 'text-success'
                                      : 'text-ink-muted'
                                  }
                                >
                                  {savedLabel(item.file.size, result.size)}
                                </span>
                              </p>
                            ) : pdfPage ? (
                              <p className="font-mono text-mono-caption text-ink-muted">
                                {pdfPage.width}×{pdfPage.height} · {formatBytes(item.file.size)} ·{' '}
                                {pdfPage.page > 0 ? `Page ${pdfPage.page}` : 'Preparing page…'}
                              </p>
                            ) : (
                              <p className="truncate font-mono text-mono-caption text-ink-muted">
                                {formatBytes(item.file.size)} ·{' '}
                                {item.file.name.split('.').pop()?.toUpperCase()}
                              </p>
                            )}

                            {status === 'converting' ? (
                              <div className="mt-2 flex items-center gap-2">
                                <div
                                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                                  role="progressbar"
                                  aria-label={`Converting ${item.file.name}`}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-valuenow={percent}
                                >
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-200"
                                    style={{ width: `${Math.max(4, percent)}%` }}
                                  />
                                </div>
                                <span className="w-9 text-right font-mono text-[10px] text-ink-muted">
                                  {percent}%
                                </span>
                              </div>
                            ) : null}

                            {item.error ? (
                              <p className="mt-1 text-xs text-danger">{item.error}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                          {result ? (
                            <button
                              type="button"
                              onClick={() => downloadBlob(result.blob, result.name)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Icon name="download" className="h-4 w-4" />
                              Download
                            </button>
                          ) : pdfPage ? (
                            <button
                              type="button"
                              onClick={() => void downloadPage(item)}
                              disabled={pdfPageBusy === item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Icon name="download" className="h-4 w-4" />
                              {pdfPageBusy === item.id ? 'Building…' : 'Download'}
                            </button>
                          ) : null}

                          {!isRunning ? (
                            <button
                              type="button"
                              onClick={() => remove(item.id)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-danger"
                              aria-label={`Remove ${item.file.name}`}
                            >
                              <Icon name="x" className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              {items.length > 0 ? (
                <>
                  <span className="text-body-md text-ink-secondary">
                    {items.length} photo{items.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clear()
                      setNotice(null)
                    }}
                    disabled={isRunning}
                    className="text-xs font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear queue
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
              {pdfExport ? (
                <button
                  type="button"
                  onClick={downloadDocument}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-control text-primary transition-colors hover:border-primary/50 hover:bg-primary-soft/70"
                >
                  <Icon name="download" className="h-4 w-4" />
                  Download PDF ({pdfExport.pages} page{pdfExport.pages === 1 ? '' : 's'})
                </button>
              ) : doneItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void downloadAll()}
                  disabled={zipBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-control text-primary transition-colors hover:border-primary/50 hover:bg-primary-soft/70 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon
                    name={zipBusy ? 'loader' : 'download'}
                    className={`h-4 w-4 ${zipBusy ? 'animate-spin' : ''}`}
                  />
                  {zipBusy ? 'Zipping…' : `Download all (${doneItems.length})`}
                </button>
              ) : null}

              <button
                type="button"
                onClick={resetOptions}
                disabled={isRunning}
                className="rounded-xl border border-line bg-surface px-4 py-2.5 text-control text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset options
              </button>

              <button
                type="button"
                onClick={convert}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-control text-white shadow-md transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                disabled={items.length === 0 || isRunning}
              >
                <Icon
                  name={isRunning ? 'loader' : 'bolt'}
                  className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''}`}
                />
                {isRunning
                  ? isAssemblingPdf
                    ? 'Building PDF…'
                    : 'Converting…'
                  : doneItems.length > 0 || pdfPages.length > 0
                    ? 'Convert again'
                    : 'Convert photos'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
