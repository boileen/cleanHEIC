import { Link } from 'react-router-dom'

import { converterRoutes } from '@/app/routes'
import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'
import { guidesMeta, publishedArticles } from '@/content/articles'
import { usePageMeta } from '@/lib/useDocumentMeta'

export function GuidesPage() {
  usePageMeta(guidesMeta)

  return (
    <Container className="py-12 sm:py-16">
      <span className="eyebrow">Guides</span>
      <h1 className="mt-5 text-headline-lg text-ink">HEIC guides that actually help</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-ink-secondary">
        Short, practical answers to the questions people ask most about HEIC photos — on iPhone,
        Windows, Mac and in the browser.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {converterRoutes.map((route) => {
          const items = publishedArticles.filter((article) => article.converter === route.path)
          if (items.length === 0) return null

          return (
            <section key={route.path}>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {route.navLabel}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {items.map((article) => (
                  <li key={article.slug}>
                    <Link
                      to={`/guides/${article.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
                    >
                      <span className="text-sm font-semibold text-ink">{article.title}</span>
                      <Icon
                        name="arrow-right"
                        className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </Container>
  )
}
