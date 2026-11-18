import { describe, expect, it } from 'vitest'

import { DEFAULT_MARGIN_MM, PAGE_SIZES, fitOnPage, orientPage } from '@/engine/pdf-layout'

describe('PDF page layout', () => {
  it('defines A4 and US Letter in millimetres', () => {
    expect(PAGE_SIZES.a4).toEqual({ width: 210, height: 297 })
    expect(PAGE_SIZES.letter).toEqual({ width: 215.9, height: 279.4 })
  })

  it('turns portrait photos into portrait pages and landscape into landscape', () => {
    expect(orientPage('a4', 3024, 4032)).toEqual({ width: 210, height: 297 })
    expect(orientPage('a4', 4032, 3024)).toEqual({ width: 297, height: 210 })
    expect(orientPage('letter', 3024, 4032)).toEqual({ width: 215.9, height: 279.4 })
    expect(orientPage('letter', 4032, 3024)).toEqual({ width: 279.4, height: 215.9 })
  })

  it('fits a portrait photo inside the margins and centres it', () => {
    const placement = fitOnPage({ width: 210, height: 297 }, 3024, 4032)

    expect(placement.width).toBeCloseTo(190)
    expect(placement.height).toBeCloseTo(253.33, 1)
    expect(placement.x).toBeCloseTo(10)
    expect(placement.y).toBeCloseTo(21.83, 1)
    expect(placement.x + placement.width).toBeLessThanOrEqual(210)
    expect(placement.y + placement.height).toBeLessThanOrEqual(297)
  })

  it('fits a landscape photo into a landscape page', () => {
    const placement = fitOnPage({ width: 297, height: 210 }, 4032, 3024)

    expect(placement.width).toBeCloseTo(253.33, 1)
    expect(placement.height).toBeCloseTo(190)
    expect(placement.x).toBeCloseTo(21.83, 1)
    expect(placement.y).toBeCloseTo(10)
  })

  it('keeps extreme aspect ratios inside the page', () => {
    const placement = fitOnPage({ width: 210, height: 297 }, 10_000, 10)

    expect(placement.width).toBeCloseTo(190)
    expect(placement.height).toBeLessThan(1)
    expect(placement.y + placement.height).toBeLessThanOrEqual(297)
  })

  it('uses a 10 mm margin by default', () => {
    expect(DEFAULT_MARGIN_MM).toBe(10)
  })
})
