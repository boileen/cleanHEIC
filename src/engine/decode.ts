import libheif from 'libheif-js/wasm-bundle.js'

export interface DecodedImage {
  data: Uint8ClampedArray<ArrayBuffer>
  width: number
  height: number
  hasAlpha: boolean
}

const DECODE_ERROR = 'This file could not be decoded — it may be corrupt or unsupported.'

/**
 * Decodes the primary image in a HEIC file into RGBA pixels.
 *
 * `libheif-js/wasm-bundle` is used rather than the asm.js entry point: it is
 * roughly three times faster on a 12 MP photo and needs no separate `.wasm`
 * asset or server MIME configuration.
 */
export async function decodeHeic(bytes: Uint8Array): Promise<DecodedImage> {
  let images
  try {
    const decoder = new libheif.HeifDecoder()
    images = decoder.decode(bytes)
  } catch {
    throw new Error(DECODE_ERROR)
  }

  const image = images.find((candidate) => candidate.is_primary()) ?? images[0]
  if (!image) {
    throw new Error(DECODE_ERROR)
  }

  try {
    const width = image.get_width()
    const height = image.get_height()
    if (!width || !height) {
      throw new Error(DECODE_ERROR)
    }

    const target = new Uint8ClampedArray(width * height * 4)
    const hasAlpha = Boolean(image.has_alpha_channel())

    return await new Promise<DecodedImage>((resolve, reject) => {
      try {
        image.display({ data: target, width, height }, (result) => {
          if (!result) {
            reject(new Error(DECODE_ERROR))
            return
          }

          resolve({
            data: result.data,
            width: result.width,
            height: result.height,
            hasAlpha,
          })
        })
      } catch {
        reject(new Error(DECODE_ERROR))
      }
    })
  } finally {
    image.free()
  }
}
