import type { ConvertFormat } from './types'

export const MIME_TYPES: Record<ConvertFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function mimeType(format: ConvertFormat): string {
  return MIME_TYPES[format]
}

/** Canvas encoders expect 0–1, our UI works in 10–100. */
export function qualityFraction(quality: number): number {
  const clamped = Number.isFinite(quality) ? Math.min(100, Math.max(10, quality)) : 85
  return clamped / 100
}
