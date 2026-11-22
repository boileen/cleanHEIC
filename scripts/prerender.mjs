/**
 * Pre-renders every page in `prerenderPages` so crawlers and link previews see
 * real HTML instead of an empty div. Runs after `vite build` produces `dist/`
 * and the SSR bundle produces `dist-ssr/`.
 *
 * Usage: node scripts/prerender.mjs
 * Env:   VITE_SITE_URL (defaults to https://clearheic.com)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const distSsr = resolve(root, 'dist-ssr')

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://clearheic.com').replace(/\/$/, '')

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function withPageMeta(template, page, canonical) {
  let html = template

  // Replace (rather than duplicate) the template's default title/description.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/i,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
  )

  const extras = [
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')

  return html.replace('</head>', `    ${extras}\n  </head>`)
}

// Read the client build template once.
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

const { render, prerenderPages } = await import(
  pathToFileURL(resolve(distSsr, 'entry-server.js')).href
)

const pageUrls = []

for (const page of prerenderPages) {
  const path = page.path.replace(/^\//, '')
  const dir = resolve(dist, path === '' ? '.' : path)
  mkdirSync(dir, { recursive: true })

  const renderedHtml = render(page.path)
  const canonical = `${SITE_URL}${page.path}`

  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${renderedHtml}</div>`,
  )
  html = withPageMeta(html, page, canonical)

  writeFileSync(resolve(dir, 'index.html'), html)
  pageUrls.push(canonical)
}

// sitemap.xml — built from the same page list as the pre-rendered files.
const entries = pageUrls
  .map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`)
  .join('\n')

writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
)

// robots.txt
writeFileSync(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
)

console.log(`Prerendered ${prerenderPages.length} pages`)
console.log('Wrote sitemap.xml and robots.txt')
