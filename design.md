# ClearHEIC — Technical Design Document

| Field | Value |
|---|---|
| Product | ClearHEIC (Tool 2 of 8) |
| Domain | ClearHEIC.com |
| Version | 0.1 — Draft |
| Date | 2026-11-17 |
| Source documents | `PRD.pdf`, `reference stitch clearheic.zip`, `ClearHEIC_100_SEO_Articles.zip` |
| Status | Proposed for implementation |

---

## 1. Purpose

ClearHEIC is a browser-based utility that converts Apple HEIC photos into
JPG, PNG, WebP, or PDF **entirely on the user's device**. Files are never
uploaded to a server.

This document defines the technical architecture, stack, data flow, memory
strategy, SEO structure, deployment model, and visual design tokens for the
application.

---

## 2. Goals and non-goals

### Goals

- Convert `.heic` files locally in the browser with no uploads.
- Support JPG, PNG, WebP, and PDF output.
- Batch up to 30 files / 150 MB input without crashing the tab.
- Provide per-file quality, resizing, and metadata-stripping controls.
- Download files individually or as a single ZIP.
- Rank for four high-intent route keywords with pre-rendered HTML.
- Run on cheap static hosting (Linux VPS + cPanel).
- Reuse the conversion engine and UI shell for the other seven tools.

### Non-goals (v1)

- Server-side conversion or cloud storage.
- User accounts, databases, or saved conversion history.
- Native mobile/desktop apps.
- Editing photos (cropping, filters, color correction).
- Preserving HEIC depth maps, Live Photo motion, or HDR gain maps.

---

## 3. Architecture decision

> **Static-first website + client-side React SPA + Web Worker conversion engine.**

```
                    ┌──────────────────────────────┐
                    │  Static hosting (cPanel VPS) │
                    │  HTML + JS + CSS + WASM      │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        │                                                     │
┌───────▼─────────┐                                 ┌─────────▼──────────┐
│ Pre-rendered    │                                 │ React app shell    │
│ SEO pages       │                                 │ (hydrates)         │
│ • 5 converter   │                                 │ • Router + SEO head│
│   routes        │                                 │ • Queue UI         │
│ • 100 articles  │                                 │ • Controls         │
└─────────────────┘                                 └─────────┬──────────┘
                                                              │
                                          ┌───────────────────▼───────────────────┐
                                          │ Job store + scheduler                 │
                                          │ max 2–3 active jobs, memory guard     │
                                          └───────────────────┬───────────────────┘
                                                              │ postMessage / Comlink
                                          ┌───────────────────▼───────────────────┐
                                          │ Worker pool (2–3 Web Workers)         │
                                          │ 1. libheif WASM → ImageBitmap         │
                                          │ 2. orientation + resize               │
                                          │ 3. OffscreenCanvas → JPG/PNG/WebP     │
                                          └───────────────────┬───────────────────┘
                                                              │ Blob
                                          ┌───────────────────▼───────────────────┐
                                          │ Exporters                             │
                                          │ • individual download                 │
                                          │ • fflate → ZIP                        │
                                          │ • jsPDF → PDF                         │
                                          └───────────────────────────────────────┘
```

### Why this architecture

| Requirement | How it is satisfied |
|---|---|
| No uploads / privacy | There is no upload API; the server only serves static assets. |
| Cheap hosting | Static files on cPanel; no conversion servers or queues. |
| SEO | Routes and articles are pre-rendered to real HTML at build time. |
| Large batches | Scheduler limits concurrency and enforces a decoded-memory budget. |
| Responsive UI | Decoding/encoding runs in Workers, not the main thread. |
| Reuse across 8 tools | Conversion logic lives in a standalone engine module. |

### Alternative considered

| Option | Verdict |
|---|---|
| Plain React SPA (no pre-render) | Rejected — weak SEO for 100 articles and 5 keyword routes. |
| Astro + React island | Strong alternative; best raw SEO/performance. Choose if content is the primary growth channel. |
| Next.js static export | Acceptable, but heavier than needed and differs from the PRD stack. |
| Server-side conversion | Rejected — breaks the privacy promise, adds cost and legal risk. |

**Recommendation:** start with **Vite + React 18 + TypeScript** and pre-render
routes at build time (`vite-react-ssg` or `vike`). If the team prefers Astro,
keep the React converter as a client-only island.

---

## 4. Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript | Required for file-state correctness. |
| UI | React 18 | Matches PRD. |
| Build | Vite | Fast, simple static output. |
| Styling | Tailwind CSS | Design tokens from Stitch reference. |
| Routing | React Router | One workspace component driven by route config. |
| Pre-rendering | `vite-react-ssg` or `vike` | Static HTML per route and article. |
| State | Zustand | Queue and job state without excessive re-renders. |
| Worker RPC | Comlink | Promise-based worker calls. |
| HEIC decode | `libheif-js` (WASM) | Gives raw pixels for custom encode. `heic2any` is acceptable for an MVP only. |
| Resize / encode | `OffscreenCanvas` | `convertToBlob` for JPEG, PNG, WebP. |
| PDF | `jsPDF` | One image per page in v1. |
| ZIP | `fflate` | Streaming ZIP; `JSZip` acceptable for a simple MVP. |
| Metadata | `exifr` | Read EXIF/GPS; stripping happens by re-encoding. |
| Validation | Magic-byte check | Do not trust file extensions. |
| Tests | Vitest + Playwright | Unit tests plus real-browser E2E. |
| Hosting | cPanel static `dist/` | `.htaccess` for rewrites, MIME, caching. |

### Dependencies to self-host

- Plus Jakarta Sans and JetBrains Mono font files.
- All JS/WASM assets. No Tailwind CDN, no Google Fonts, no third-party scripts.

---

## 5. Proposed folder structure

```
clearheic/
├─ public/
│  ├─ .htaccess
│  ├─ robots.txt
│  └─ favicon/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ router.tsx
│  │  └─ routes.ts               # route → title, H1, keyword, default format
│  ├─ components/
│  │  ├─ layout/                 # header, footer, nav
│  │  ├─ converter/              # dropzone, controls, queue, result row
│  │  └─ seo/                    # JSON-LD, meta, FAQ accordion
│  ├─ features/
│  │  ├─ queue/                  # job store, scheduler, selectors
│  │  └─ export/                 # download, ZIP, PDF orchestration
│  ├─ engine/
│  │  ├─ worker.ts               # worker entry point
│  │  ├─ decode.ts               # libheif wrapper
│  │  ├─ encode.ts               # canvas resize + encode
│  │  ├─ validate.ts             # MIME + magic bytes
│  │  ├─ metadata.ts             # EXIF read/strip
│  │  ├─ pdf.ts                  # jsPDF builder
│  │  ├─ zip.ts                  # fflate builder
│  │  └─ types.ts
│  ├─ store/
│  │  └─ useJobStore.ts
│  ├─ content/
│  │  ├─ routes/                 # route copy and FAQ data
│  │  └─ articles/               # Markdown/MDX from the 100 SEO drafts
│  ├─ lib/                       # formatting, file names, analytics
│  └─ styles/
│     └─ tokens.css
├─ tests/
│  ├─ unit/
│  ├─ e2e/
│  └─ fixtures/                  # real HEIC samples
├─ design.md
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

If the eight tools are a real roadmap, convert this into a pnpm monorepo:

```
apps/clearheic
packages/heic-engine
packages/ui
packages/seo
```

---

## 6. Conversion pipeline

### 6.1 File intake

1. User drops files or picks them through `<input type="file" multiple>`.
2. Accept only `.heic` plus MIME `image/heic`.
3. Verify **magic bytes**: ISO BMFF `ftyp` brands such as `heic`, `heix`,
   `hevc`, `hevx`, `mif1`, `msf1`.
4. Reject unsupported files with a toast:
   *"Only .HEIC files are supported."*
5. Enforce the queue limits (30 files, 150 MB total input).

### 6.2 Job state machine

```
queued → decoding → encoding → ready
   │         │          │
   └─────────┴──────────┴──→ failed
   └─────────┴──────────┴──→ cancelled
```

Each job carries: `id`, `file`, `state`, `progress`, `sourceMeta`,
`outputBlob`, `outputMeta`, `error`, `abortController`.

### 6.3 Processing steps

1. Scheduler admits a job only when a worker slot and memory budget are free.
2. Worker reads the file as `ArrayBuffer`.
3. `libheif-js` decodes to RGBA / `ImageBitmap`.
4. Apply orientation (`irot` / `imir` / EXIF orientation).
5. Resize with `createImageBitmap(..., { resizeWidth, resizeHeight, resizeQuality })`
   or `OffscreenCanvas`.
6. Encode:
   - JPG → `image/jpeg`, quality 0.10–1.00
   - PNG → `image/png`, lossless (quality control disabled)
   - WebP → `image/webp`, quality 0.10–1.00
   - PDF → keep a JPEG/PNG Blob for `jsPDF`
7. Return `{ blob, width, height, bytes }` to the main thread.
8. Main thread creates an object URL, computes savings, updates the row.
9. On clear/unmount: `URL.revokeObjectURL()`, `ImageBitmap.close()`, drop refs.

### 6.4 Output matrix

| Output | Encoder | Quality | Transparency | Notes |
|---|---|---|---|---|
| JPG | Canvas JPEG | 10–100% (default 85) | No | Best compatibility. |
| PNG | Canvas PNG | Lossless | Yes | Use for portraits/stickers. |
| WebP | Canvas WebP | 10–100% (default 80) | Yes | Fallback to JPG if encode unsupported. |
| PDF | jsPDF | Image quality follows source | No | v1: one image per page. |

### 6.5 EXIF and GPS

- Default: **strip**. Re-encoding through canvas removes metadata naturally.
- Optional: **keep**. Requires a library such as `piexifjs` and careful merge
  after encoding.
- Orientation must be applied to pixels before stripping so the image is not
  rotated incorrectly.

---

## 7. Memory management

HEIC files are compressed; decoded pixels are large:

```
12 MP ≈ 4032 × 3024 × 4 bytes ≈ 48 MB
48 MP ≈ 8064 × 6048 × 4 bytes ≈ 195 MB
```

Rules:

- Input cap: **30 files / 150 MB**.
- Estimate decoded bytes as `width × height × 4` and enforce a budget.
- Concurrency: **2 workers on desktop**, **1 on mobile / low-memory devices**
  (`navigator.deviceMemory` where available).
- Downscale during decode whenever the user chose a smaller preset.
- Recycle workers every **10–20 jobs** to avoid WASM heap fragmentation.
- Never keep base64 data URLs for full images; use Blob URLs only.
- Prefer streaming ZIP (`fflate`) for large batches.
- Validate output: reject zero-byte or dimension-mismatched results with a
  "Conversion Failed" badge.

Suggested limits (tune after testing):

| Limit | Value |
|---|---|
| Max queued files | 30 |
| Max total input | 150 MB |
| Max single decoded image | 200 MB estimated |
| Max concurrent decodes (desktop) | 2 |
| Max concurrent decodes (mobile) | 1 |
| Worker recycle interval | 15 jobs |

---

## 8. SEO and routing

One workspace component is reused across routes. Each route supplies its own
metadata and defaults.

| Route | H1 | Primary keyword | Default output |
|---|---|---|---|
| `/heic-to-jpg` | Convert HEIC to JPG Instantly | heic to jpg | JPG |
| `/heic-to-png` | Convert HEIC to Lossless PNG | heic to png | PNG |
| `/heic-to-webp` | Convert HEIC to WebP for Web & SEO | heic to webp | WebP |
| `/heic-to-pdf` | Convert iPhone HEIC Photos to PDF | heic to pdf | PDF |

Each page must include:

- Unique `<title>`, meta description, canonical URL, and H1.
- Open Graph / Twitter card metadata.
- JSON-LD: `SoftwareApplication`, `FAQPage`, and `HowTo` where relevant.
- Below-the-fold content: 4-step process, feature grid, format comparison,
  FAQ accordion, internal links.
- Pre-rendered HTML at build time. Do not rely on client-side hydration for
  indexable content.

### Articles

- Convert the 100 DOCX drafts to Markdown/MDX and generate pages at build time.
- Store the SEO brief as front matter: keyword, title, description, URL.
- Add `sitemap.xml`, `robots.txt`, and internal links from articles to routes.
- Review drafts before publishing; the source files explicitly say
  *"Draft: review and verify site features before publishing."*

---

## 9. Visual design tokens

The canonical palette follows the PRD. The Stitch `DESIGN.md` is close but has
slightly different raw values; use the tokens below and treat Stitch as the
layout reference.

### Colors

| Token | Value | Usage |
|---|---|---|
| `primary` | `#4F46E5` | Primary buttons, active tabs, progress fill |
| `primary-hover` | `#4338CA` | Hover state |
| `primary-active` | `#3730A3` | Pressed state |
| `secondary` | `#06B6D4` | Metrics, speed cues, informational accents |
| `canvas` | `#F8FAFC` | Page background |
| `surface` | `#FFFFFF` | Cards, dropzone, queue rows |
| `border` | `#E2E8F0` | Card and control borders |
| `text-primary` | `#0F172A` | Headings |
| `text-secondary` | `#475569` | Body copy |
| `text-muted` | `#94A3B8` | Captions, disabled states |
| `success-text` | `#10B981` | Savings percentage |
| `success-bg` | `#ECFDF5` | Success badge background |
| `success-border` | `#A7F3D0` | Success badge border |
| `error` | `#BA1A1A` | Errors and failed conversions |

### Typography

| Role | Font | Size / weight |
|---|---|---|
| Hero headline | Plus Jakarta Sans | 3rem / 800, tight tracking |
| Section headline | Plus Jakarta Sans | 1.75rem / 700 |
| Card title | Plus Jakarta Sans | 1.25rem / 600 |
| Body | Plus Jakarta Sans | 1rem / 400 |
| Controls | Plus Jakarta Sans | 0.875rem / 600 |
| Metrics | JetBrains Mono | 0.875rem / 500 |
| Captions / badges | JetBrains Mono | 0.75rem / 400 |

### Shape and spacing

- Base radius: `0.5rem` for buttons, inputs, rows.
- Cards and dropzone: `1rem`.
- Pills and badges: `9999px`.
- Layout: single column max `768px`; batch workspace max `1120px`.
- Desktop margins `2rem`, gutter `1.5rem`; mobile padding `1rem`.
- Spacing scale: 4 / 8 / 16 / 24 / 40 px.

### Core components

- Sticky top navigation with brand lockup and route links.
- Hero with H1 and trust badges ("100% On-Device", "Zero Uploads").
- Segmented format selector.
- Quality slider with numeric readout.
- Resize dropdown.
- Privacy toggle for EXIF/GPS stripping.
- Dashed dropzone with drag-over state.
- Queue rows with filename, dimensions, before → after size, progress bar,
  status badge, and download action.
- Global actions: clear queue, download all as ZIP.
- FAQ accordion and comparison table below the fold.

---

## 10. Deployment

### Build and upload

```
npm run build   →   dist/
```

Upload `dist/` to `public_html` on the cPanel VPS.

### `.htaccess` requirements

```apache
AddType application/wasm .wasm

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/wasm
</IfModule>

# Hashed assets: cache forever
<FilesMatch "\.(js|css|woff2|wasm|png|jpg|webp|svg)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# HTML: always revalidate
<FilesMatch "\.html$">
  Header set Cache-Control "no-cache"
</FilesMatch>

# SPA fallback for unknown paths
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

If multithreaded WASM / `SharedArrayBuffer` is used later, add:

```apache
Header set Cross-Origin-Opener-Policy "same-origin"
Header set Cross-Origin-Embedder-Policy "require-corp"
```

Test that this does not break any embedded resources.

---

## 11. Privacy and security

- No file data leaves the browser. No upload endpoint exists.
- Self-host fonts, scripts, and WASM. Avoid CDNs and third-party embeds.
- Strip EXIF/GPS by default.
- Set a Content Security Policy allowing only the site's own origin.
- Sanitize filenames before writing ZIP entries; handle duplicate names.
- Do not persist images in `localStorage`, IndexedDB, or cookies.
- Analytics, if any, must never receive filenames or image data. Prefer
  privacy-friendly, self-hosted analytics or none at all.
- Remove or qualify unverified marketing claims:
  - "100% lossless" is wrong for JPG (JPG is lossy).
  - "HIPAA & GDPR compliant" requires legal review.
  - "Works 100% offline" is only true after the app shell is cached.

---

## 12. Testing

### Unit (Vitest)

- Magic-byte validation.
- Job state transitions and cancellation.
- File-size formatting and savings math.
- Filename sanitization and duplicate handling.
- Route metadata mapping.

### End-to-end (Playwright)

- Convert one HEIC to each output format.
- Batch of 10 files with progress and ZIP download.
- Reject a `.jpg` renamed to `.heic`.
- Cancel mid-conversion.
- Reload and confirm nothing persisted.
- Keyboard-only dropzone operation.

### Fixtures

Include real samples: iPhone 12/15, portrait orientation, alpha cutout,
48 MP, burst/sequence, corrupt file, EXIF-rotated variant.

### Browser matrix

Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome.

### Manual checks

- 30-file memory soak test with DevTools memory profile.
- Verify EXIF/GPS removed from output.
- Verify orientation is correct.
- Verify zero-byte outputs are blocked.
- Lighthouse: performance, accessibility, SEO.

---

## 13. Build phases

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 0. Spike | Worker-based HEIC decode prototype | 10 real HEIC files decode correctly |
| 1. Engine | `engine/` package with tests | Decode → orient → resize → encode works for JPG/PNG/WebP |
| 2. Workspace | Upload, queue, controls, individual download | 10-file batch succeeds without UI freeze |
| 3. Exports | ZIP and PDF | ZIP downloads and opens; PDF pages are correct |
| 4. SEO | 4 routes, prerender, articles pipeline | Crawlers see full HTML; sitemap valid |
| 5. Hardening | Cross-browser, memory, a11y, launch | No crashes in 30-file test; Lighthouse SEO ≥ 95 |

### MVP scope

If time is tight, ship **JPG + PNG + batch ZIP** first. Add WebP and PDF in
phase 2.

---

## 14. Open decisions

1. **PDF scope:** simple image-per-page export (PRD) or multi-page document
   compiler with reordering (Stitch mockup)?
2. **Batch limit:** PRD says 30 files; the WebP mockup says 100. Pick one and
   use it everywhere.
3. **Framework:** Vite + React with prerendering, or Astro with a React island?
4. **Monorepo:** build for one tool now, or structure for all eight?
5. **Offline claim:** invest in a PWA service worker, or change the copy?
6. **Compliance claims:** remove "HIPAA/GDPR" language until reviewed.
7. **Analytics:** none, or privacy-friendly aggregate metrics?

---

## 15. Definition of done for v1

- A user can drop 30 HEIC photos, convert them to the selected format, and
  download individually or as a ZIP.
- No network request carries image data.
- All four routes are pre-rendered with unique metadata and pass SEO checks.
- The four route pages and the 100 articles are reachable from the sitemap.
- The app works in Chrome, Edge, Firefox, and Safari.
- The 30-file soak test completes without a tab crash.
- EXIF/GPS is stripped by default and verified in the output.
