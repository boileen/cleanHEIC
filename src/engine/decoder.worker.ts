import * as Comlink from 'comlink'

import { decodeHeic } from './decode'
import { qualityFraction } from './encode'
import { fitWithin } from './resize'
import type { ConvertedImage, ConvertOptions, WorkerApi } from './types'

const mimeFor: Record<ConvertOptions['format'], string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function resizeCanvas(
  canvas: OffscreenCanvas,
  width: number,
  height: number,
  maxEdge: number | null,
): { canvas: OffscreenCanvas; width: number; height: number } {
  const target = fitWithin(width, height, maxEdge)
  if (target.width === width && target.height === height) {
    return { canvas, width, height }
  }

  const resized = new OffscreenCanvas(target.width, target.height)
  const context = resized.getContext('2d')
  if (!context) {
    throw new Error('This browser does not support local canvas processing.')
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(canvas, 0, 0, target.width, target.height)

  return { canvas: resized, width: target.width, height: target.height }
}

async function convert(
  file: File,
  options: ConvertOptions,
  onProgress: (value: number) => void,
): Promise<ConvertedImage> {
  onProgress(0.05)

  const bytes = new Uint8Array(await file.arrayBuffer())
  onProgress(0.12)

  const decoded = await decodeHeic(bytes)
  onProgress(0.55)

  let canvas = new OffscreenCanvas(decoded.width, decoded.height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('This browser does not support local canvas processing.')
  }
  context.putImageData(new ImageData(decoded.data, decoded.width, decoded.height), 0, 0)

  // JPEG has no alpha channel; composite transparent areas onto white rather
  // than letting the encoder turn them black.
  if (options.format === 'jpeg' && decoded.hasAlpha) {
    const flattened = new OffscreenCanvas(decoded.width, decoded.height)
    const flattenContext = flattened.getContext('2d')
    if (!flattenContext) {
      throw new Error('This browser does not support local canvas processing.')
    }
    flattenContext.fillStyle = '#FFFFFF'
    flattenContext.fillRect(0, 0, decoded.width, decoded.height)
    flattenContext.drawImage(canvas, 0, 0)
    canvas = flattened
  }

  onProgress(0.65)
  const resized = resizeCanvas(canvas, decoded.width, decoded.height, options.maxEdge)
  onProgress(0.78)

  const type = mimeFor[options.format]
  const blob = await resized.canvas.convertToBlob(
    options.format === 'png'
      ? { type }
      : { type, quality: qualityFraction(options.quality) },
  )

  if (blob.type !== type) {
    throw new Error(`This browser cannot encode ${options.format.toUpperCase()} files.`)
  }

  onProgress(0.95)
  return { blob, width: resized.width, height: resized.height }
}

const api: WorkerApi = { convert }

Comlink.expose(api)
