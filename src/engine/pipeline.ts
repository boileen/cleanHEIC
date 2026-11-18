import type { OutputFormat } from '@/app/routes'

import { convertImage } from './client'
import { outputFilename, uniqueFilename } from './naming'
import type { ConvertFormat } from './types'

export interface PipelineJob {
  file: File
  format: ConvertFormat
  quality: number
  maxEdge: number | null
}

export interface PipelineResult {
  name: string
  blob: Blob
  width: number
  height: number
  originalSize: number
}

export function convertFormatFor(output: OutputFormat): ConvertFormat | null {
  if (output === 'jpg') return 'jpeg'
  if (output === 'png') return 'png'
  if (output === 'webp') return 'webp'
  return null
}

/** Reserves collision-free output names before any work starts. */
export function planOutputNames(
  items: Array<{ id: string; file: File }>,
  format: ConvertFormat,
): Map<string, string> {
  const used = new Set<string>()
  const names = new Map<string, string>()

  for (const item of items) {
    names.set(item.id, uniqueFilename(outputFilename(item.file.name, format), used))
  }

  return names
}

export async function convertFile(
  job: PipelineJob,
  outputName: string,
  onProgress: (value: number) => void,
): Promise<PipelineResult> {
  const { blob, width, height } = await convertImage(
    job.file,
    { format: job.format, quality: job.quality, maxEdge: job.maxEdge },
    onProgress,
  )

  return {
    name: outputName,
    blob,
    width,
    height,
    originalSize: job.file.size,
  }
}
