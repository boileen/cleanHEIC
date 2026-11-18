import { zip, type AsyncZippable } from 'fflate'

export interface ZipEntry {
  name: string
  blob: Blob
}

export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  const files: AsyncZippable = {}

  for (const entry of entries) {
    files[entry.name] = [new Uint8Array(await entry.blob.arrayBuffer()), { level: 6 }]
  }

  const archive = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (error, result) => {
      if (error) {
        reject(error)
        return
      }
      resolve(result)
    })
  })

  const buffer = archive.buffer.slice(
    archive.byteOffset,
    archive.byteOffset + archive.byteLength,
  ) as ArrayBuffer
  return new Blob([buffer], { type: 'application/zip' })
}

export function zipFilename(format: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `clearheic-${format}-${stamp}.zip`
}
