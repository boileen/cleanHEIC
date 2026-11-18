import { useEffect } from 'react'

import type { ConverterRoute } from '@/app/routes'

function ensureMeta(selector: string, attributes: Record<string, string>): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value))
  return element
}

export function useDocumentMeta(route: ConverterRoute): void {
  useEffect(() => {
    document.title = route.metaTitle

    ensureMeta('meta[name="description"]', {
      name: 'description',
      content: route.metaDescription,
    })
    ensureMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: route.metaTitle,
    })
    ensureMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: route.metaDescription,
    })
    ensureMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    })
    ensureMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}${route.path}`
  }, [route])
}
