import { unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { mimeType, qualityFraction } from '@/engine/encode'
import { outputFilename, uniqueFilename } from '@/engine/naming'
import { convertFormatFor, planOutputNames } from '@/engine/pipeline'
import { fitWithin } from '@/engine/resize'
import { createZip, zipFilename } from '@/engine/zip'

describe('output naming', () => {
  it('swaps the HEIC extension for the target one', () => {
    expect(outputFilename('IMG_1234.HEIC', 'jpeg')).toBe('IMG_1234.jpg')
    expect(outputFilename('holiday.HEIC', 'png')).toBe('holiday.png')
    expect(outputFilename('my.photo.heic', 'webp')).toBe('my.photo.webp')
  })

  it('falls back to a usable name when the source has no stem', () => {
    expect(outputFilename('.heic', 'jpeg')).toBe('image.jpg')
  })

  it('adds a numeric suffix for duplicate names', () => {
    const used = new Set<string>()
    expect(uniqueFilename('IMG_1.jpg', used)).toBe('IMG_1.jpg')
    expect(uniqueFilename('IMG_1.jpg', used)).toBe('IMG_1-1.jpg')
    expect(uniqueFilename('IMG_1.jpg', used)).toBe('IMG_1-2.jpg')
  })

  it('reserves unique names in queue order', () => {
    const names = planOutputNames(
      [
        { id: 'a', file: new File(['a'], 'IMG_1.HEIC') },
        { id: 'b', file: new File(['b'], 'IMG_1.HEIC') },
        { id: 'c', file: new File(['c'], 'IMG_2.heic') },
      ],
      'jpeg',
    )

    expect(names.get('a')).toBe('IMG_1.jpg')
    expect(names.get('b')).toBe('IMG_1-1.jpg')
    expect(names.get('c')).toBe('IMG_2.jpg')
  })
})

describe('resize', () => {
  it('keeps the native size when no limit is set', () => {
    expect(fitWithin(4032, 3024, null)).toEqual({ width: 4032, height: 3024 })
    expect(fitWithin(4032, 3024, undefined)).toEqual({ width: 4032, height: 3024 })
  })

  it('never upscales a small image', () => {
    expect(fitWithin(800, 600, 1920)).toEqual({ width: 800, height: 600 })
  })

  it('scales the longest edge for landscape and portrait sources', () => {
    expect(fitWithin(4032, 3024, 1920)).toEqual({ width: 1920, height: 1440 })
    expect(fitWithin(3024, 4032, 1280)).toEqual({ width: 960, height: 1280 })
  })

  it('always leaves at least one pixel', () => {
    expect(fitWithin(4000, 2, 10)).toEqual({ width: 10, height: 1 })
  })
})

describe('encoding', () => {
  it('maps formats to MIME types', () => {
    expect(mimeType('jpeg')).toBe('image/jpeg')
    expect(mimeType('png')).toBe('image/png')
    expect(mimeType('webp')).toBe('image/webp')
  })

  it('clamps quality into the 10–100 range', () => {
    expect(qualityFraction(85)).toBeCloseTo(0.85)
    expect(qualityFraction(0)).toBeCloseTo(0.1)
    expect(qualityFraction(250)).toBeCloseTo(1)
    expect(qualityFraction(Number.NaN)).toBeCloseTo(0.85)
  })

  it('only has a conversion target for image formats', () => {
    expect(convertFormatFor('jpg')).toBe('jpeg')
    expect(convertFormatFor('png')).toBe('png')
    expect(convertFormatFor('webp')).toBe('webp')
    expect(convertFormatFor('pdf')).toBeNull()
  })
})

describe('zip output', () => {
  it('stores each converted file under its download name', async () => {
    const archive = await createZip([
      { name: 'IMG_1.jpg', blob: new Blob([new Uint8Array([1, 2, 3])]) },
      { name: 'IMG_2.jpg', blob: new Blob([new Uint8Array([4, 5])]) },
    ])

    expect(archive.type).toBe('application/zip')
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()))
    expect(Array.from(files['IMG_1.jpg'])).toEqual([1, 2, 3])
    expect(Array.from(files['IMG_2.jpg'])).toEqual([4, 5])
  })

  it('names archives by format and day', () => {
    expect(zipFilename('jpg')).toMatch(/^clearheic-jpg-\d{4}-\d{2}-\d{2}\.zip$/)
  })
})
