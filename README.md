# ClearHEIC

A private, in-browser HEIC converter for JPG, PNG, WebP, and PDF.

ClearHEIC decodes Apple HEIC photos directly in the browser using WebAssembly.
Files are never uploaded to a server. The app is a static site: the host only
serves HTML, JavaScript, CSS, fonts, and WASM.

## Documentation

| Document | Purpose |
|---|---|
| `design.md` | Product design, visual tokens, and stack |
| `architecture.md` | System architecture, contracts, deployment |
| `plan.md` | Milestone plan and launch checklist |

## Current status

The four converter routes are live: HEIC to JPG, PNG, WebP, and PDF. JPG, PNG,
and WebP run through a real WebAssembly decoder and produce verified output. PDF
export compiles one image per page into an A4 or US Letter document, with a
single-page PDF available from each result row.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (queue state)
- libheif-js (WebAssembly decoder)
- OffscreenCanvas (encoding)
- jsPDF and fflate (exports)

## Commands

```bash
npm install
npm run dev        # local development
npm run build      # typecheck, client build, SSR build, prerender, SEO validation
npm run preview    # preview the production build
npm run typecheck  # TypeScript only
npm run lint       # oxlint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright end-to-end tests (uses installed Chrome)
```

## SEO and deployment

`npm run build` pre-renders the four converter routes into `dist/<route>/index.html`
with real titles, H1s, canonical links and Open Graph tags, then writes
`sitemap.xml` and `robots.txt`. The build fails if a page is missing its title,
H1 or canonical, or if two pages share one.

Canonical URLs default to `https://clearheic.com`. Set `VITE_SITE_URL` in Netlify's
environment variables to override it — useful for preview deployments. Netlify
serves real files before applying the SPA fallback, so the pre-rendered pages
are delivered directly.

## Structure

```
src/
  app/          route config, router, app shell
  components/   layout, marketing, workspace, UI primitives
  content/      FAQ and article content
  engine/       HEIC decode, resize, encode, ZIP pipeline
  lib/          formatting and document metadata helpers
  pages/        route pages
  store/        queue state
tests/
  unit/         Vitest tests
  e2e/          Playwright tests
  fixtures/     real HEIC test photo (supplied locally, see below)
```

The end-to-end tests decode a real iPhone HEIC file, and that fixture is not
committed because it contains camera and GPS metadata. See
`tests/fixtures/README.md` for how to add your own photo before running
`npm run test:e2e`.

## Privacy

There is no upload endpoint. The conversion pipeline runs in the browser, and
temporary object URLs are revoked when a queue is cleared or the page closes.
See `architecture.md` for the full privacy and security model.
