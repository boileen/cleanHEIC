import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const tailwindConfig = require('../../tailwind.config.cjs')
const colors = tailwindConfig.theme.extend.colors as Record<string, unknown>

function color(token: string): string {
  if (token.startsWith('#')) return token
  let value: unknown = colors
  for (const part of token.split('.')) {
    value = (value as Record<string, unknown> | undefined)?.[part]
  }
  if (typeof value !== 'string') throw new Error(`Unknown color token: ${token}`)
  return value
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const [r, g, b] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(foreground: string, background: string): number {
  const values = [luminance(color(foreground)), luminance(color(background))].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

const textPairs: Array<[string, string]> = [
  ['ink.DEFAULT', 'surface'],
  ['ink.DEFAULT', 'canvas'],
  ['ink.secondary', 'surface'],
  ['ink.secondary', 'canvas'],
  ['ink.muted', 'surface'],
  ['ink.muted', 'canvas'],
  ['#FFFFFF', 'primary.DEFAULT'],
  ['#FFFFFF', 'primary.hover'],
  ['primary.DEFAULT', 'primary.soft'],
  ['success.DEFAULT', 'success.bg'],
  ['danger', 'surface'],
  ['danger', 'canvas'],
]

describe('palette contrast', () => {
  it.each(textPairs)('%s on %s meets WCAG AA for text (4.5:1)', (foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['primary.DEFAULT', 'surface'],
    ['primary.DEFAULT', 'canvas'],
  ])('%s on %s is visible as a focus indicator (3:1)', (foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3)
  })

  it('keeps the legacy indigo and cyan out of the palette', () => {
    const serialized = JSON.stringify(colors).toUpperCase()
    expect(serialized).not.toContain('#4F46E5')
    expect(serialized).not.toContain('#06B6D4')
    expect(colors).not.toHaveProperty('secondary')
  })
})
