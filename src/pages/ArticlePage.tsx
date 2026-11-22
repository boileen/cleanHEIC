import { Link, useParams } from 'react-router-dom'

import { Container } from '@/components/layout/Container'
import { Icon } from '@/components/ui/Icon'
import {
  getPublishedArticle,
  relatedArticles,
  type Article,
} from '@/content/articles'
import { useArticleMeta } from '@/lib/useDocumentMeta'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function ArticlePage() {
  const { slug } = useParams()
  const article = slug ? getPublishedArticle(slug) : undefined
  return article ? <ArticleView article={article} /> : <NotFoundPage />
}

function ArticleView({ article }: { article: Article }) {
  useArticleMeta(article)
  const related = relatedArticles(article)

  return (
    <>
      <Container className="py-10 sm:py-14">
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-primary"
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          All guides
        </Link>

        <h1 className="mt-6 max-w-3xl text-headline-lg text-ink">{article.title}</h1>
        <p className="mt-4 max-w-2xl text-body-lg text-ink-secondary">
          {article.description}
        </p>

        <div className="mt-8 max-w-3xl border-t border-line pt-6">
          <div className="article-prose" dangerouslySetInnerHTML={{ __html: article.html }} />
        </div>
      </Container>

      {related.length > 0 ? (
        <section className="border-t border-line bg-surface py-12">
          <Container>
            <h2 className="text-headline-md text-ink">Related guides</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/guides/${item.slug}`}
                    className="block h-full rounded-xl border border-line bg-canvas p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="text-sm font-semibold text-ink">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="py-12">
        <Container>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
            <h2 className="text-headline-md text-ink">Ready to convert your photos?</h2>
            <p className="max-w-md text-body-md text-ink-secondary">
              ClearHEIC runs entirely in your browser. No upload, no account, no waiting.
            </p>
            <Link to={article.converter} className="btn-primary">
              Open the converter
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
