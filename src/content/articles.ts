import { marked } from 'marked'

export const guidesMeta = {
  title: 'HEIC Guides & Tutorials | ClearHEIC',
  description:
    'Practical guides for converting HEIC photos to JPG, PNG, WebP and PDF on iPhone, Windows and Mac — privately in your browser.',
  path: '/guides',
}

export interface Article {
  slug: string
  title: string
  description: string
  converter: string
  published: boolean
  related: string[]
  html: string
}

interface ParsedMarkdown {
  meta: Record<string, string>
  body: string
}

function parseMarkdown(raw: string): ParsedMarkdown {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error('Article is missing front matter')

  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z]+):\s*(.*)$/)
    if (!pair) continue
    let value = pair[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"')
    }
    meta[pair[1]] = value
  }
  return { meta, body: match[2] }
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => item.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
}

const files = import.meta.glob('./articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const articles: Article[] = Object.values(files)
  .map((raw) => {
    const { meta, body } = parseMarkdown(raw)
    // The page renders its own H1, so drop the markdown title duplicate.
    const bodyWithoutTitle = body.replace(/^\s*# [^\r\n]*\r?\n+/, '')
    return {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      converter: meta.converter,
      published: meta.published === 'true',
      related: parseList(meta.related),
      html: marked.parse(bodyWithoutTitle, { async: false }) as string,
    }
  })
  .sort((a, b) => a.slug.localeCompare(b.slug))

export const publishedArticles = articles.filter((article) => article.published)

export function getPublishedArticle(slug: string): Article | undefined {
  return publishedArticles.find((article) => article.slug === slug)
}

export function relatedArticles(article: Article): Article[] {
  return article.related
    .map((slug) => getPublishedArticle(slug))
    .filter((value): value is Article => Boolean(value))
}
