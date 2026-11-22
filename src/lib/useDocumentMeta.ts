import { useEffect } from 'react'

import type { ConverterRoute } from '@/app/routes'

interface PageMeta {
  title: string
  description: string
  path: string
}

function ensureMeta(selector: string, attributes: Record<string, string>): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value))
  return element
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://clearheic.com'

function applyMeta({ title, description, path }: PageMeta): void {
  document.title = title

  ensureMeta('meta[name="description"]', {
    name: 'description',
    content: description,
  })
  ensureMeta('meta[property="og:title"]', {
    property: 'og:title',
    content: title,
  })
  ensureMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: description,
  })
  ensureMeta('meta[property="og:type"]', {
    property: 'og:type',
    content: 'website',
  })
  ensureMeta('meta[property="og:url"]', {
    property: 'og:url',
    content: `${SITE_URL}${path}`,
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
  canonical.href = `${SITE_URL}${path}`
}

export function useDocumentMeta(route: ConverterRoute): void {
  useEffect(() => {
    applyMeta({
      title: route.metaTitle,
      description: route.metaDescription,
      path: route.path,
    })
  }, [route])
}

export function useArticleMeta(article: {
  title: string
  description: string
  slug: string
}): void {
  useEffect(() => {
    applyMeta({
      title: article.title,
      description: article.description,
      path: `/guides/${article.slug}`,
    })
  }, [article])
}

export function usePageMeta({ title, description, path }: PageMeta): void {
  useEffect(() => {
    applyMeta({ title, description, path })
  }, [title, description, path])
}
