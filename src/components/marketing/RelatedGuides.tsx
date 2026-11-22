import { Link } from 'react-router-dom'

import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'
import { publishedArticles } from '@/content/articles'

export function RelatedGuides({ converter }: { converter: string }) {
  const guides = publishedArticles
    .filter((article) => article.converter === converter)
    .slice(0, 3)

  if (guides.length === 0) return null

  return (
    <section className="border-t border-line bg-surface py-12">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-headline-md text-ink">Related guides</h2>
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            All guides
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((article) => (
            <li key={article.slug}>
              <Link
                to={`/guides/${article.slug}`}
                className="group block h-full rounded-xl border border-line bg-canvas p-4 transition-colors hover:border-primary/40"
              >
                <span className="block text-sm font-semibold text-ink">{article.title}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors group-hover:text-primary">
                  Read guide
                  <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
