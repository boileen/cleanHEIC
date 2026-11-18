// @vitest-environment node
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { decodeHeic } from '@/engine/decode'

const fixture = new URL('../fixtures/heic_test.heic', import.meta.url)

describe('HEIC decoder', () => {
  it('decodes the real iPhone fixture at its native size', async () => {
    const decoded = await decodeHeic(new Uint8Array(readFileSync(fixture)))

    expect(decoded.width).toBe(3024)
    expect(decoded.height).toBe(4032)
    expect(decoded.data).toHaveLength(3024 * 4032 * 4)
    expect(decoded.hasAlpha).toBe(false)
  }, 30_000)

  it('turns corrupt input into a friendly error', async () => {
    await expect(decodeHeic(new Uint8Array([0, 1, 2, 3, 4]))).rejects.toThrow(
      /could not be decoded/,
    )
  }, 30_000)
})
