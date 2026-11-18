import { describe, expect, it } from 'vitest'

import { formatBytes } from '@/lib/format'

describe('formatBytes', () => {
  it('formats zero and invalid values', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
    expect(formatBytes(-10)).toBe('0 B')
  })

  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3.4 MB')
  })

  it('uses whole numbers for values of ten or more', () => {
    expect(formatBytes(15 * 1024)).toBe('15 KB')
    expect(formatBytes(150 * 1024 * 1024)).toBe('150 MB')
  })
})
