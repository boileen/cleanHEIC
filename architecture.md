# ClearHEIC — System Architecture

| Field | Value |
|---|---|
| Product | ClearHEIC (Tool 2 of 8) |
| Domain | ClearHEIC.com |
| Version | 0.1 — Draft |
| Date | 2026-11-17 |
| Related documents | `design.md`, `PRD.pdf`, `reference stitch clearheic.zip` |
| Status | Proposed for implementation |

---

## 1. Architectural summary

ClearHEIC is a **static website with a client-side conversion engine**.

There is no application server, no upload endpoint, and no database. The
production host serves HTML, JavaScript, CSS, fonts, and WebAssembly files.
Every image operation — decode, resize, encode, PDF creation, ZIP packaging —
runs inside the user's browser.

```
┌────────────┐        HTTPS         ┌──────────────────────────┐
│   User     │ ───────────────────→ │  Static host (cPanel)    │
│  browser   │ ←─────────────────── │  HTML/JS/CSS/WASM only   │
└─────┬──────┘                      └──────────────────────────┘
      │
      │ all image processing stays here
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser sandbox                                             │
│                                                             │
│  React UI  ←→  Job store/scheduler  ←→  Worker pool         │
│                                              │              │
│                                              ├─ HEIC decode │
│                                              ├─ resize      │
│                                              └─ encode      │
│                                                             │
│  Exporters: individual download · ZIP · PDF                 │
└─────────────────────────────────────────────────────────────┘
```

### Primary constraints

| Constraint | Consequence |
|---|---|
| No uploads allowed | All conversion logic must ship to the client. |
| Up to 30 files / 150 MB | Admission control and memory budgeting are mandatory. |
| HEIC decodes to large raw pixels | Concurrency must stay low; workers must be recycled. |
| SEO depends on four routes + 100 articles | Pages must be pre-rendered, not client-only. |
| Hosting is a single Linux VPS with cPanel | Deployment is a static `dist/` upload. |
| "Tool 2 of 8" | The engine should be extractable for reuse. |

---

## 2. System context

### Actors

| Actor | Interaction |
|---|---|
| Visitor | Uploads HEIC files, chooses settings, downloads results. |
| Search crawler | Reads pre-rendered converter pages and articles. |
| Site owner | Builds locally, uploads `dist/` to cPanel. |

### External systems

| System | Required? | Purpose |
|---|---|---|
| None at runtime | — | No APIs, auth, storage, or third-party services. |
| Build tooling | Yes | Node.js, Vite, package registry. |
| cPanel / Apache | Yes | Static file serving and SPA rewrites. |

The absence of runtime dependencies is intentional. It is what makes the
privacy claim verifiable.

---

## 3. Container view

```
┌─────────────────────────────────────────────────────────────────────┐
│ Static host                                                         │
│                                                                     │
│  ┌─────────────────────┐   ┌─────────────────────────────────────┐  │
│  │ Pre-rendered HTML   │   │ Hashed static assets                │  │
│  │ • 5 route pages     │   │ • JS chunks                         │  │
│  │ • 100 article pages │   │ • CSS, fonts, images                │  │
│  │ • sitemap.xml       │   │ • WASM decoder                      │  │
│  └──────────┬──────────┘   └──────────────────┬──────────────────┘  │
└─────────────┼─────────────────────────────────┼─────────────────────┘
              │                                 │
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Browser                                                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ React application                                             │  │
│  │                                                               │  │
│  │  Router + route config ──→ Workspace UI                       │  │
│  │                              │                                │  │
│  │                              ▼                                │  │
│  │                       Job store (Zustand)                     │  │
│  │                              │                                │  │
│  │                              ▼                                │  │
│  │                       Scheduler + memory guard                │  │
│  │                              │ Comlink                        │  │
│  │                              ▼                                │  │
│  │                       Worker pool (2 workers)                 │  │
│  │                       ├─ validate                             │  │
│  │                       ├─ libheif WASM decode                  │  │
│  │                       ├─ orient + resize                      │  │
│  │                       └─ OffscreenCanvas encode               │  │
│  │                              │                                │  │
│  │                              ▼                                │  │
│  │                       Exporters                               │  │
│  │                       ├─ download                              │  │
│  │                       ├─ fflate ZIP                            │  │
│  │                       └─ jsPDF PDF                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component responsibilities

### 4.1 App shell

| Responsibility | Detail |
|---|---|
| Routing | React Router with four converter routes plus article routes. |
| Route config | Single source of truth for title, H1, keyword, default format, FAQ copy. |
| Hydration | Hydrates pre-rendered HTML; no content depends on client fetch. |
| Layout | Sticky navigation, hero, workspace, below-the-fold SEO sections. |

The route config must not contain duplicated JSX per route. One workspace
component reads the active route and changes metadata and defaults.

### 4.2 Workspace UI

| Component | Responsibility |
|---|---|
| `Dropzone` | Drag/drop, file picker, paste, validation feedback. |
| `FormatSelector` | JPG / PNG / WebP / PDF segmented control. |
| `QualitySlider` | 10–100%, disabled and labelled lossless for PNG. |
| `ResizeSelect` | Original / 1920 / 1280 / 800 max edge. |
| `PrivacyToggle` | Strip EXIF/GPS, default ON. |
| `QueueList` | Virtualised list of job rows with progress and actions. |
| `SummaryBar` | Total files, total savings, clear queue, download all. |
| `ResultRow` | Filename, dimensions, before → after size, status, download. |
| `ToastRegion` | Accessible live region for validation and errors. |

### 4.3 Job store

Zustand store holding:

- The ordered job list.
- Active worker assignments.
- Global settings.
- Aggregate metrics.
- Error and cancellation state.

The store contains **no image pixel data**. It holds file references and Blob
URLs only.

### 4.4 Scheduler

The scheduler is the memory safety mechanism. It decides when a job may start.

```
admit(job):
  if cancelled or failed: return
  if activeJobs >= concurrencyLimit: wait
  if reservedBytes + estimate(job) > memoryBudget: wait
  reservedBytes += estimate(job)
  activeJobs += 1
  dispatch(job)
```

Rules:

- Concurrency: 2 desktop, 1 mobile/low-memory.
- Admission is FIFO.
- A cancelled queued job is removed without decoding.
- A cancelled active job calls `AbortController.abort()` and terminates or
  recycles its worker.
- If every queued job exceeds the budget, the job fails with a clear
  "image too large for this device" message rather than crashing the tab.

### 4.5 Worker pool

- Two dedicated module workers, created lazily on the first file.
- Each worker owns its own WASM decoder instance.
- Jobs are dispatched through Comlink.
- Worker is recycled after 15 jobs or after a decode failure.
- Workers return finished `Blob`s, not raw pixel buffers, to minimise
  main-thread memory pressure.

### 4.6 Engine modules

| Module | Responsibility |
|---|---|
| `validate.ts` | Extension, MIME, ISO BMFF `ftyp` brand checks. |
| `decode.ts` | libheif-js wrapper; returns RGBA or `ImageBitmap` plus dimensions. |
| `transform.ts` | Applies orientation, resize, and canvas draw. |
| `encode.ts` | `OffscreenCanvas.convertToBlob` for JPEG/PNG/WebP. |
| `metadata.ts` | Reads EXIF with `exifr`; strips by re-encoding. |
| `pdf.ts` | Builds a PDF with `jsPDF`. |
| `zip.ts` | Builds a ZIP with `fflate`. |
| `types.ts` | Shared contracts. |

The engine must be usable without React. This keeps it testable and reusable
for the other seven tools.

### 4.7 Exporters

| Exporter | Behaviour |
|---|---|
| Individual | Creates an object URL and triggers an anchor download. |
| ZIP | Streams entries with `fflate`; sanitises filenames; avoids duplicates. |
| PDF | Adds each ready image as a page; A4 or Letter; auto orientation. |

Exports only run on jobs in the `ready` state. Partial batches are allowed.

---

## 5. Contracts

### 5.1 Domain types

```ts
type OutputFormat = 'jpg' | 'png' | 'webp' | 'pdf';

type JobState =
  | 'queued'
  | 'decoding'
  | 'encoding'
  | 'ready'
  | 'failed'
  | 'cancelled';

interface ConversionOptions {
  format: OutputFormat;
  quality: number;        // 0.10–1.00, ignored for PNG
  maxEdge: number | null; // null = original
  stripMetadata: boolean;
}

interface ImageMeta {
  width: number;
  height: number;
  bytes: number;
  mime: string;
}

interface Job {
  id: string;
  file: File;
  state: JobState;
  progress: number;       // 0–100
  options: ConversionOptions;
  sourceMeta?: ImageMeta;
  outputMeta?: ImageMeta;
  outputBlob?: Blob;
  outputUrl?: string;
  error?: { code: string; message: string };
  abortController: AbortController;
}
```

### 5.2 Worker protocol

```ts
type WorkerRequest =
  | { type: 'convert'; id: string; file: File; options: ConversionOptions }
  | { type: 'cancel'; id: string }
  | { type: 'ping' };

type WorkerResponse =
  | { type: 'progress'; id: string; phase: 'decode' | 'transform' | 'encode'; value: number }
  | { type: 'done'; id: string; blob: Blob; meta: ImageMeta }
  | { type: 'error'; id: string; code: string; message: string };
```

`File` and `Blob` are structured-cloneable; no manual buffer marshalling is
needed. Never send an `ImageBitmap` back to the main thread unless required —
return the encoded Blob instead.

### 5.3 Error codes

| Code | User-facing message |
|---|---|
| `UNSUPPORTED_TYPE` | Only .HEIC files are supported. |
| `INVALID_CONTAINER` | This file is not a valid HEIC image. |
| `DECODE_FAILED` | This photo could not be decoded. |
| `UNSUPPORTED_VARIANT` | This HEIC variant is not supported yet. |
| `OUT_OF_MEMORY` | This image is too large for this device. |
| `ENCODE_FAILED` | The image could not be converted. |
| `EMPTY_OUTPUT` | Conversion produced an empty file. |
| `CANCELLED` | Conversion cancelled. |

---

## 6. Runtime flows

### 6.1 Single-file conversion

```
User        UI            Store        Scheduler     Worker
 │           │              │              │            │
 │ drop file │              │              │            │
 ├──────────→│ validate     │              │            │
 │           ├─────────────→│ add job      │            │
 │           │              ├─────────────→│ admit      │
 │           │              │              ├───────────→│ convert
 │           │              │              │            ├─ decode
 │           │              │              │            ├─ orient
 │           │              │              │            ├─ resize
 │           │              │              │            ├─ encode
 │           │              │←─────────────┴────────────┤ done
 │           │←─────────────┤ update ready │            │
 │ download  │              │ create URL   │            │
 ├──────────→│              │              │            │
```

### 6.2 Batch flow

1. Files are validated and added as `queued`.
2. Scheduler starts up to the concurrency limit.
3. As each job finishes, the next queued job is admitted.
4. User may download rows as they become ready.
5. "Download All as ZIP" includes only `ready` jobs and reports skipped ones.
6. "Clear Queue" aborts active jobs and revokes all object URLs.

### 6.3 ZIP flow

```
ready jobs → sanitise names → fflate stream → Blob → object URL → anchor
```

- Sanitise `../`, `\`, control characters, and reserved Windows names.
- Resolve duplicate basenames with ` (2)`, ` (3)`, etc.
- Keep the original extension matching the chosen output format.

### 6.4 PDF flow

1. Collect ready JPEG blobs in queue order.
2. Determine page size (A4/Letter) and orientation from image dimensions.
3. Add one image per page with margins.
4. Save as `clearheic-document.pdf`.
5. Release source blobs after the PDF Blob is created.

v1 is intentionally single-image-per-page. Multi-page reordering, custom
margins, and 300 DPI placement are a separate feature.

---

## 7. Rendering and SEO architecture

### 7.1 Build-time rendering

```
Route config + article front matter
              │
              ▼
      Static site generator
              │
              ├─ /heic-to-jpg/index.html
              ├─ /heic-to-png/index.html
              ├─ /heic-to-webp/index.html
              ├─ /heic-to-pdf/index.html
              ├─ /blog/<slug>/index.html
              ├─ sitemap.xml
              └─ robots.txt
```

- Every indexable page exists as HTML before JavaScript runs.
- React hydrates the workspace; article pages may need no hydration at all.
- Metadata, canonical URLs, Open Graph tags, and JSON-LD are generated from the
  same route/article data used by the UI.

### 7.2 Route configuration

| Route | H1 | Keyword | Default format |
|---|---|---|---|
| `/heic-to-jpg` | Convert HEIC to JPG Instantly | heic to jpg | jpg |
| `/heic-to-png` | Convert HEIC to Lossless PNG | heic to png | png |
| `/heic-to-webp` | Convert HEIC to WebP for Web & SEO | heic to webp | webp |
| `/heic-to-pdf` | Convert iPhone HEIC Photos to PDF | heic to pdf | pdf |

The workspace is shared; copy, H1, FAQ, and default format differ per route to
avoid duplicate-content problems.

### 7.3 Article pipeline

- Source: the 100 DOCX drafts.
- Convert to Markdown/MDX, preserving the SEO brief as front matter.
- Build one static page per article.
- Generate internal links to the four converter routes.
- Fail the build on duplicate titles, duplicate canonicals, or missing
  descriptions.

Articles are **drafts**, not publish-ready copy. They require an editorial pass
and feature verification before release.

### 7.4 Hydration strategy

| Page type | JavaScript needed |
|---|---|
| Home / converter routes | Yes — workspace is interactive. |
| Articles | No, or only navigation and FAQ accordion. |
| Legal/privacy pages | No. |

Keep the converter bundle out of article pages through code splitting.

---

## 8. Memory architecture

### 8.1 Budget model

```
estimatedDecodedBytes = width × height × 4
estimatedPeakBytes    = estimatedDecodedBytes × 1.5   // decode + encode copies
```

```
12 MP ≈ 48 MB decoded  → ~72 MB peak
48 MP ≈ 195 MB decoded → ~292 MB peak
```

### 8.2 Policy

| Policy | Value |
|---|---|
| Max queued files | 30 |
| Max total input | 150 MB |
| Max single-image peak estimate | 300 MB |
| Concurrency — desktop | 2 |
| Concurrency — mobile / low memory | 1 |
| Worker recycle | Every 15 jobs |

### 8.3 Lifecycle rules

- `ImageBitmap.close()` immediately after drawing.
- `URL.revokeObjectURL()` on clear, replace, unmount, and export completion.
- Null out `outputBlob` only after the download has started.
- Never store full images in Zustand, `localStorage`, or IndexedDB.
- Recreate a worker after a decode crash; do not reuse a corrupted WASM heap.
- Prefer `Blob` over base64 strings everywhere.

### 8.4 Graceful degradation

- If `navigator.deviceMemory` reports ≤ 4 GB, force concurrency 1.
- If `OffscreenCanvas` is unavailable, fall back to a main-thread canvas with a
  warning and reduced concurrency.
- If WebP encoding is unsupported, disable WebP and explain why.
- If WebAssembly is unavailable, show a compatibility message instead of
  failing silently.

---

## 9. Deployment architecture

### 9.1 Environments

| Environment | Purpose | Host |
|---|---|---|
| Local | Development | Vite dev server |
| Preview | Build verification | Static preview / staging folder |
| Production | Public site | cPanel `public_html` |

There are no runtime environment variables and no secrets in the client bundle.

### 9.2 Build pipeline

```
install → typecheck → unit tests → build → prerender → sitemap → upload dist/
```

Recommended CI gates:

- TypeScript strict mode passes.
- Unit tests pass.
- Bundle-size budget passes.
- Lighthouse SEO/accessibility thresholds pass.
- No `http://` or third-party runtime URLs in the bundle.

### 9.3 Static hosting configuration

Required Apache behaviour:

- Serve existing files directly.
- Rewrite unknown paths to `index.html` for client-side routing.
- Serve `.wasm` as `application/wasm`.
- Long-lived immutable caching for hashed assets.
- Revalidation for HTML.
- Compression for HTML, CSS, JS, and WASM.
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, CSP, HSTS.

If multithreaded WASM is introduced, add COOP/COEP headers and re-test every
embedded resource.

### 9.4 Content delivery

- All assets are same-origin.
- Fonts are self-hosted.
- WASM is lazily fetched on first file selection, not on initial page load.
- Optional service worker caches the app shell and WASM for repeat visits.
  Never cache user images.

---

## 10. Security and privacy architecture

| Concern | Control |
|---|---|
| File confidentiality | No upload endpoint exists; conversion is local. |
| Third-party leakage | No external scripts, fonts, analytics, or CDNs at runtime. |
| Metadata leakage | EXIF/GPS stripped by default before download. |
| Persistence | No image storage in cookies, localStorage, or IndexedDB. |
| XSS | React escaping, no `dangerouslySetInnerHTML` for user content, CSP. |
| WASM execution | CSP includes `'wasm-unsafe-eval'` only where required. |
| ZIP filenames | Sanitised against traversal, control characters, reserved names. |
| Supply chain | Lockfile, dependency audit, pinned versions, no postinstall scripts. |
| Error reporting | No filenames or image data in logs; analytics optional and aggregate only. |

### Claims that require review

- "100% lossless" — false for JPG; only true for PNG.
- "HIPAA & GDPR compliant" — needs legal review before publishing.
- "Works 100% offline" — only after the app shell is cached.
- "Up to 100 files" — conflicts with the 30-file PRD limit.

---

## 11. Reliability and failure handling

| Failure | Detection | Response |
|---|---|---|
| Invalid file renamed `.heic` | Magic-byte check | Reject with `INVALID_CONTAINER`. |
| Unsupported HEIC variant | Decoder error | `UNSUPPORTED_VARIANT`; keep the app usable. |
| Worker crash | Timeout / error event | Recycle worker, fail the job, continue queue. |
| Out-of-memory | Estimate exceeds budget or allocation error | `OUT_OF_MEMORY`; do not retry automatically. |
| Zero-byte output | `blob.size === 0` | Mark failed; block download. |
| Wrong dimensions | Compare output meta to expected | Mark failed; log code only. |
| Cancellation race | Job ID check on worker response | Ignore late responses. |
| ZIP duplicate names | Basename set | Append numeric suffix. |
| Browser without WASM | Feature detection | Compatibility notice, disable conversion. |

No automatic retries for deterministic decode failures. One retry is acceptable
for worker crashes.

---

## 12. Performance budgets

| Metric | Target |
|---|---|
| Initial HTML + CSS + JS (gzip, excluding WASM) | ≤ 180 KB |
| WASM decoder (lazy) | ≤ 2.5 MB |
| LCP on converter page (4G) | ≤ 2.5 s |
| INP during conversion | ≤ 200 ms |
| CLS | ≤ 0.05 |
| Lighthouse SEO | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| 10-file batch, 12 MP each | ≤ 20 s on a mid-range laptop |

Techniques:

- Lazy-load `libheif-js`, `jsPDF`, and `fflate`.
- Code-split article pages from the converter.
- Preload the WASM file when the dropzone becomes visible.
- Virtualise the queue list if row count grows.
- Avoid re-rendering the whole queue on every progress tick; update per row.

---

## 13. Testing architecture

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Validation, scheduler, filename handling, metadata mapping. |
| Integration | Vitest + happy-dom | Store transitions, cancellation, ZIP naming. |
| E2E | Playwright | Real browser conversion with real HEIC fixtures. |
| Visual | Playwright screenshots | Route layouts at desktop/tablet/mobile. |
| Performance | DevTools + Lighthouse CI | Memory soak, bundle size, Core Web Vitals. |
| Accessibility | axe-core | Keyboard, labels, live regions, contrast. |

Required fixtures:

- iPhone 12 and iPhone 15 standard photos.
- Portrait-orientation image.
- Alpha/transparent cutout.
- 48 MP image.
- `.heif` variant.
- Corrupt file with `.heic` extension.
- JPEG renamed to `.heic`.

Browser matrix: Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome.

---

## 14. Architecture decisions

| ID | Decision | Rationale | Consequence |
|---|---|---|---|
| ADR-001 | Client-side conversion only | Verifiable privacy, zero server cost | Large WASM bundle; device-dependent performance |
| ADR-002 | Static hosting + prerendering | SEO for 100 articles, cheap cPanel hosting | Build-time content pipeline required |
| ADR-003 | Worker pool with 1–2 concurrency | Keeps UI responsive and memory bounded | Batch throughput lower than unbounded parallelism |
| ADR-004 | `libheif-js` over `heic2any` | Raw pixels allow resize and WebP quality control | More integration work than `heic2any` |
| ADR-005 | Zustand for job state | Small, fast, no provider nesting | Team must learn one small library |
| ADR-006 | `fflate` for ZIP | Streaming and lower memory than `JSZip` | Different API from the PRD's `JSZip` mention |
| ADR-007 | Route-driven shared workspace | Four SEO routes without four copies of the app | Route config must stay disciplined |
| ADR-008 | No persistence of user images | Privacy and simplicity | No resume-after-reload feature |
| ADR-009 | Single-image-per-page PDF in v1 | Matches PRD scope; simpler queue | Multi-page compiler becomes a later feature |
| ADR-010 | Self-host all runtime assets | Privacy claim and offline capability | Larger repo; font/WASM handling |

---

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| libheif fails on some iPhone variants | Users cannot convert certain photos | Fixture coverage; clear error; revisit decoder choice |
| Mobile tab crashes on 48 MP batches | Lost work, bad reviews | Conservative concurrency, memory estimates, downscale-first |
| Safari canvas/WebP differences | Broken output on iOS | Feature detection and fallback to JPG |
| SPA SEO underperforms | Articles never rank | Pre-render every route and article; validate with crawler tests |
| 100 articles are low-quality drafts | Thin content, cannibalisation | Editorial pass, unique intros/FAQs, canonical discipline |
| cPanel header limitations | CSP/COOP/COEP not applied | Verify with `curl -I`; fallback to simpler headers |
| WASM bundle too large | Slow first conversion | Lazy-load, compress, cache, show progress |
| Scope creep into multi-page PDF | Delays MVP | Keep v1 single-image-per-page |
| Unverified compliance claims | Legal exposure | Remove or review before launch |

---

## 16. Evolution path

### Near term

1. Extract `engine/` into `packages/heic-engine`.
2. Add a shared design-system package for the eight tools.
3. Add PWA caching if offline use is a real requirement.

### Later

- Multi-page PDF compiler with reordering and custom margins.
- AVIF and multi-image sequence support.
- Multithreaded WASM with `SharedArrayBuffer` behind COOP/COEP.
- Optional desktop wrapper (Tauri/Electron) only if browser limits become
  blocking.

### Explicitly avoided

- Server-side conversion as a "fallback". It would invalidate the privacy
  promise and turn a static site into an infrastructure project.
- User accounts and cloud libraries. They add cost, compliance burden, and
  attack surface without serving the core job.

---

## 17. Out of scope for this architecture

- Billing, accounts, and authentication.
- Native mobile applications.
- Photo editing features.
- Server APIs, databases, queues, or cron jobs.
- Admin dashboards.
- Email delivery.

---

## 18. Definition of done

- The production build is a static `dist/` directory with no runtime backend.
- All four converter routes and all published articles are pre-rendered.
- A 30-file batch completes or fails gracefully without crashing the tab.
- No network request contains image bytes.
- EXIF/GPS is stripped by default and verified.
- The same engine code can be imported by another tool without React.
- The site passes the agreed Lighthouse, accessibility, and browser matrices.
