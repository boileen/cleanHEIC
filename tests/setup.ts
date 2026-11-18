import '@testing-library/jest-dom/vitest'

// jsdom's Blob predates Blob.arrayBuffer(), which every supported browser has.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer !== 'function') {
  const prototype = Blob.prototype as unknown as {
    arrayBuffer?: () => Promise<ArrayBuffer>
  }

  prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
