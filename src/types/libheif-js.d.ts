declare module 'libheif-js/wasm-bundle.js' {
  interface HeifDisplayTarget {
    data: Uint8ClampedArray<ArrayBuffer>
    width: number
    height: number
  }

  interface HeifDisplayResult {
    data: Uint8ClampedArray<ArrayBuffer>
    width: number
    height: number
  }

  interface HeifImage {
    get_width(): number
    get_height(): number
    is_primary(): boolean
    has_alpha_channel(): boolean
    display(target: HeifDisplayTarget, callback: (result: HeifDisplayResult | null) => void): void
    free(): void
  }

  interface HeifDecoder {
    decode(data: Uint8Array): HeifImage[]
  }

  interface LibHeif {
    HeifDecoder: new () => HeifDecoder
  }

  const libheif: LibHeif
  export default libheif
}
