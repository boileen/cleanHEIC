import { afterEach, describe, expect, it } from 'vitest'

import { useQueueStore } from '@/store/queue'

afterEach(() => {
  useQueueStore.getState().clear()
})

describe('queue input validation', () => {
  it('accepts .heic files regardless of extension case', () => {
    const message = useQueueStore.getState().addFiles([
      new File(['a'], 'IMG_0001.HEIC'),
      new File(['b'], 'IMG_0002.heic'),
    ])

    expect(message).toBeNull()
    expect(useQueueStore.getState().items).toHaveLength(2)
  })

  it('rejects .heif files and other image types', () => {
    const message = useQueueStore.getState().addFiles([
      new File(['a'], 'photo.heif'),
      new File(['b'], 'photo.jpg'),
    ])

    expect(message).toBe('2 files skipped — only .HEIC files are supported.')
    expect(useQueueStore.getState().items).toHaveLength(0)
  })

  it('keeps accepted files while reporting the skipped ones', () => {
    const message = useQueueStore.getState().addFiles([
      new File(['a'], 'photo.HEIC'),
      new File(['b'], 'photo.HEIF'),
    ])

    expect(message).toBe('1 file skipped — only .HEIC files are supported.')
    expect(useQueueStore.getState().items).toHaveLength(1)
    expect(useQueueStore.getState().items[0].file.name).toBe('photo.HEIC')
  })
})
