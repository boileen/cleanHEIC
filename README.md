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
npm run build      # typecheck + production build
npm run preview    # preview the production build
npm run typecheck  # TypeScript only
npm run lint       # oxlint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright end-to-end tests (uses installed Chrome)
```

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
