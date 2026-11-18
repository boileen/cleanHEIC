export type ConvertFormat = 'jpeg' | 'png' | 'webp'

export interface ConvertOptions {
  format: ConvertFormat
  /** 10–100. Ignored for PNG. */
  quality: number
  /** Longest-edge limit in pixels, or null to keep the native size. */
  maxEdge: number | null
}

export interface ConvertedImage {
  blob: Blob
  width: number
  height: number
}

export interface WorkerApi {
  convert(
    file: File,
    options: ConvertOptions,
    onProgress: (value: number) => void,
  ): Promise<ConvertedImage>
}
