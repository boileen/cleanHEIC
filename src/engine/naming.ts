import type { ConvertFormat } from './types'

export const EXTENSIONS: Record<ConvertFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

export function outputFilename(original: string, format: ConvertFormat): string {
  const trimmed = original.trim() || 'image'
  const base = trimmed.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}.${EXTENSIONS[format]}`
}

/** Appends -1, -2… when two queued files share a name. */
export function uniqueFilename(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }

  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot) : ''

  let index = 1
  let candidate = `${base}-${index}${extension}`
  while (used.has(candidate)) {
    index += 1
    candidate = `${base}-${index}${extension}`
  }

  used.add(candidate)
  return candidate
}
