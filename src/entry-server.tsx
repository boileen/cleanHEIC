import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'

import { converterRoutes } from '@/app/routes'
import App from '@/app/App'
import { guidesMeta, publishedArticles } from '@/content/articles'

/**
 * Every path that gets a pre-rendered index.html at build time. Shared by
 * `scripts/prerender.mjs` and `scripts/validate-seo.mjs` so the two cannot
 * disagree about what should exist.
 */
export const prerenderPages = [
  ...converterRoutes.map((route) => ({
    path: route.path,
    title: route.metaTitle,
    description: route.metaDescription,
  })),
  {
    path: guidesMeta.path,
    title: guidesMeta.title,
    description: guidesMeta.description,
  },
  ...publishedArticles.map((article) => ({
    path: `/guides/${article.slug}`,
    title: article.title,
    description: article.description,
  })),
]

/**
 * Renders the whole app for one path into HTML. Effects (like the canonical
 * link written by the document meta hooks) do not run on the server; the
 * prerender script injects that metadata into <head> itself.
 */
export function render(pathname: string): string {
  return renderToString(
    <StaticRouter location={pathname}>
      <App />
    </StaticRouter>,
  )
}
