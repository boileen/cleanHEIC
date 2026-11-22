/**
 * Build-time guard for the pre-rendered SEO output. Fails the build when a
 * page is missing its title/H1/canonical, or when two pages share a title or
 * canonical URL — mistakes that quietly harm search rankings.
 *
 * Usage: node scripts/validate-seo.mjs
 * Env:   VITE_SITE_URL (defaults to https://clearheic.com)
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://clearheic.com').replace(/\/$/, '')

const { prerenderPages } = await import(
  pathToFileURL(resolve(root, 'dist-ssr', 'entry-server.js')).href
)

const errors = []
const titles = new Map()
const canonicals = new Map()

const count = (html, pattern) => (html.match(pattern) ?? []).length

for (const page of prerenderPages) {
  const path = page.path.replace(/^\//, '')
  let html
  try {
    html = readFileSync(resolve(dist, path, 'index.html'), 'utf8')
  } catch {
    errors.push(`${page.path}: index.html is missing — did prerender run?`)
    continue
  }

  const titleTags = html.match(/<title>([\s\S]*?)<\/title>/gi) ?? []
  if (titleTags.length !== 1) {
    errors.push(`${page.path}: expected 1 <title>, found ${titleTags.length}`)
  } else {
    const title = titleTags[0].replace(/<\/?title>/gi, '').trim()
    if (!title) errors.push(`${page.path}: <title> is empty`)
    if (titles.has(title)) {
      errors.push(`Duplicate title "${title}" on ${titles.get(title)} and ${page.path}`)
    }
    titles.set(title, page.path)
  }

  const canonicalTags = html.match(/<link[^>]+rel="canonical"[^>]*>/gi) ?? []
  if (canonicalTags.length !== 1) {
    errors.push(`${page.path}: expected 1 canonical link, found ${canonicalTags.length}`)
  } else {
    const href = canonicalTags[0].match(/href="([^"]*)"/i)?.[1] ?? ''
    const expected = `${SITE_URL}${page.path}`
    if (href !== expected) {
      errors.push(`${page.path}: canonical is "${href}", expected "${expected}"`)
    }
    if (canonicals.has(href)) {
      errors.push(`Duplicate canonical "${href}" on ${canonicals.get(href)} and ${page.path}`)
    }
    canonicals.set(href, page.path)
  }

  const h1Count = count(html, /<h1[\s>]/gi)
  if (h1Count !== 1) {
    errors.push(`${page.path}: expected 1 <h1>, found ${h1Count}`)
  }

  if (count(html, /<meta\s+name="description"/gi) !== 1) {
    errors.push(`${page.path}: expected exactly 1 meta description`)
  }
}

// sitemap.xml must list exactly the pre-rendered pages.
let sitemap = ''
try {
  sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8')
} catch {
  errors.push('sitemap.xml is missing')
}
if (sitemap) {
  const locs = sitemap.match(/<loc>([\s\S]*?)<\/loc>/g) ?? []
  if (locs.length !== prerenderPages.length) {
    errors.push(`sitemap.xml has ${locs.length} URLs, expected ${prerenderPages.length}`)
  }
  for (const page of prerenderPages) {
    if (!sitemap.includes(`${SITE_URL}${page.path}`)) {
      errors.push(`sitemap.xml is missing ${page.path}`)
    }
  }
}

// robots.txt must point crawlers at the sitemap.
let robots = ''
try {
  robots = readFileSync(resolve(dist, 'robots.txt'), 'utf8')
} catch {
  errors.push('robots.txt is missing')
}
if (robots && !robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  errors.push('robots.txt does not reference the sitemap')
}

// cPanel/Apache needs .htaccess for slashless URLs, the SPA fallback and headers.
let htaccess = ''
try {
  htaccess = readFileSync(resolve(dist, '.htaccess'), 'utf8')
} catch {
  errors.push('.htaccess is missing from dist — cPanel routing will not work')
}
if (htaccess) {
  for (const [label, snippet] of [
    ['RewriteEngine On', 'RewriteEngine On'],
    ['pre-rendered directory rule', 'REQUEST_FILENAME}/index.html'],
    ['SPA fallback', 'RewriteRule ^ index.html'],
    ['nosniff header', 'X-Content-Type-Options'],
  ]) {
    if (!htaccess.includes(snippet)) errors.push(`.htaccess is missing ${label}`)
  }
}

if (errors.length) {
  console.error('SEO validation failed:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(
  `SEO validation passed: ${prerenderPages.length} unique titles, canonicals and H1s; .htaccess present`,
)
