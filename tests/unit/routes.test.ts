import { describe, expect, it } from 'vitest'

import { converterRoutes, formatRoutes, getConverterRoute } from '@/app/routes'

describe('route configuration', () => {
  it('defines the four converter routes', () => {
    expect(converterRoutes).toHaveLength(4)
    expect(converterRoutes.map((route) => route.path)).toEqual([
      '/heic-to-jpg',
      '/heic-to-png',
      '/heic-to-webp',
      '/heic-to-pdf',
    ])
  })

  it('gives every route unique metadata', () => {
    const titles = new Set(converterRoutes.map((route) => route.metaTitle))
    const descriptions = new Set(converterRoutes.map((route) => route.metaDescription))
    const headings = new Set(converterRoutes.map((route) => route.h1))

    expect(titles.size).toBe(converterRoutes.length)
    expect(descriptions.size).toBe(converterRoutes.length)
    expect(headings.size).toBe(converterRoutes.length)
  })

  it('maps every output format to a route', () => {
    expect(formatRoutes).toEqual({
      jpg: '/heic-to-jpg',
      png: '/heic-to-png',
      webp: '/heic-to-webp',
      pdf: '/heic-to-pdf',
    })
  })

  it('falls back to the JPG route for unknown paths', () => {
    expect(getConverterRoute('/not-a-route').path).toBe('/heic-to-jpg')
  })
})
