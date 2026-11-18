export interface Dimensions {
  width: number
  height: number
}

/**
 * Scales an image so its longest edge fits within maxEdge.
 * Never upscales; returns the original dimensions when it already fits.
 */
export function fitWithin(width: number, height: number, maxEdge?: number | null): Dimensions {
  if (!maxEdge || maxEdge <= 0 || width <= 0 || height <= 0) {
    return { width, height }
  }

  const longest = Math.max(width, height)
  if (longest <= maxEdge) {
    return { width, height }
  }

  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
