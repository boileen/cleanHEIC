# ClearHEIC — Implementation Plan

| Field | Value |
|---|---|
| Product | ClearHEIC (Tool 2 of 8) |
| Domain | ClearHEIC.com |
| Version | 0.1 — Draft |
| Date | 2026-11-17 |
| Related documents | `design.md`, `architecture.md`, `PRD.pdf` |
| Execution model | Risk-first, milestone-based |
| Estimated duration | 4–5 weeks for one developer (content editing in parallel) |

---

## 1. Guiding principles

1. **Prove the hard part first.** HEIC decoding and memory behaviour are the
   project risks. Build and test the engine before polishing the UI.
2. **Privacy is non-negotiable.** No upload endpoint, no third-party runtime
   scripts, no image persistence.
3. **Ship a thin vertical slice early.** One file → one format → one download
   before batch, ZIP, PDF, or SEO.
4. **Every milestone has an exit test.** Do not start the next milestone while
   the previous one is failing.
5. **No scope creep.** Multi-page PDF, 100-file batches, accounts, and PWA are
   post-launch work.

---

## 2. Assumptions and decisions

These are the defaults the plan uses. Change them before Milestone 1 if needed.

| Decision | Default | Notes |
|---|---|---|
| Framework | Vite + React 18 + TypeScript | Matches the PRD stack. |
| Styling | Tailwind CSS | Tokens from `design.md`. |
| Routing | React Router | Shared workspace driven by route config. |
| State | Zustand | Queue and job state. |
| Pre-rendering | `vite-react-ssg` or `vike` | Fallback: custom Playwright prerender. |
| HEIC decoder | `libheif-js` (WASM) | `heic2any` only as a fallback spike. |
| Encoding | `OffscreenCanvas` | JPEG, PNG, WebP; main-thread fallback. |
| PDF | `jsPDF` | One image per page in v1. |
| ZIP | `fflate` | Streaming, lower memory than `JSZip`. |
| Metadata | `exifr` + re-encode | Strip by default. |
| Batch limit | 30 files / 150 MB | From the PRD. |
| Concurrency | 2 desktop / 1 mobile | Adjusted by memory estimates. |
| Hosting | Static `dist/` on cPanel | Apache `.htaccess` rewrites. |
| Analytics | None by default | Privacy-friendly aggregate only if required. |

### Blocking inputs

- [ ] 5–10 real HEIC fixtures (normal, portrait, alpha, 48 MP, `.heif`, corrupt)
- [ ] Confirmation of PDF scope (single image per page for v1)
- [ ] Confirmation of the 30-file limit
- [ ] cPanel and domain access
- [ ] Approval to remove or qualify "HIPAA/GDPR" and "100% lossless" claims

---

## 3. Milestone overview

```
M0 Decisions
   │
   ▼
M1 Repo + shell ──────────────┐
   │                          │
   ▼                          │
M2 Decode spike  ◄── go/no-go │
   │                          │
   ▼                          │
M3 Engine + tests             │
   │                          │
   ▼                          │
M4 Worker pool + scheduler    │
   │                          │
   ▼                          │
M5 Workspace UI               │
   │                          │
   ▼                          │
M6 ZIP + PDF                  │
   │                          │
   ▼                          │
M7 SEO + articles             │
   │                          │
   ▼                          │
M8 Hardening                  │
   │                          │
   ▼                          │
M9 Deploy + launch            │
```

Content editing runs in parallel from M1 onward.

---

## 4. Milestone 0 — Decisions and inputs

**Duration:** 0.5 day
**Goal:** Remove ambiguity before code is written.

### Tasks

- [ ] Hold a short scope review against `PRD.pdf` and `design.md`.
- [ ] Confirm framework and pre-rendering approach.
- [ ] Confirm PDF v1 scope.
- [ ] Confirm batch limit (30 vs 100).
- [ ] Collect HEIC fixtures and store them in `tests/fixtures/`.
- [ ] Confirm hosting access and deployment method.
- [ ] Review marketing claims and remove unverified compliance language.
- [ ] Agree on browser support matrix.

### Deliverables

- Signed-off decision log (section 11).
- Fixture set available locally.
- No open blocking questions.

### Exit criteria

- Every item in "Blocking inputs" is checked or explicitly deferred.

---

## 5. Milestone 1 — Repository and shell

**Duration:** 1–2 days
**Goal:** A running app shell that matches the visual reference and has all five
routes.

### Tasks

- [ ] Extract `reference stitch clearheic.zip` into `reference/stitch/`.
  Keep the original ZIP untouched.
- [ ] Extract `ClearHEIC_100_SEO_Articles.zip` into `content/source/`.
- [ ] Scaffold Vite + React + TypeScript **without overwriting** existing docs.
- [ ] Install dependencies:
  - [ ] `react-router-dom`, `zustand`, `comlink`
  - [ ] `libheif-js`, `fflate`, `jspdf`, `exifr`
  - [ ] `vitest`, `@testing-library/react`, `playwright`
  - [ ] ESLint, Prettier
- [ ] Configure strict TypeScript, path aliases, and ESLint rules.
- [ ] Convert `design.md` tokens into Tailwind config and CSS variables.
- [ ] Self-host Plus Jakarta Sans and JetBrains Mono.
- [ ] Build layout components: header, footer, container, hero.
- [ ] Add route config for `/heic-to-jpg`, `/heic-to-png`, `/heic-to-webp`,
  `/heic-to-pdf`, `/heif-to-jpg`.
- [ ] Add a placeholder workspace card on each route.
- [ ] Verify responsive layout at 1440 / 768 / 390 px.
- [ ] Add npm scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `typecheck`,
  `lint`, `format`.

### Deliverables

- Running development server.
- Five routes with correct placeholder H1/title.
- Design tokens applied.
- CI-ready scripts.

### Exit criteria

- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- All five routes render without console errors.
- Shell visually matches the Stitch reference at three breakpoints.

---

## 6. Milestone 2 — HEIC decode spike (go/no-go)

**Duration:** 2–3 days
**Goal:** Prove that a real iPhone HEIC can be decoded and re-encoded in a
browser Worker.

### Tasks

- [ ] Create a temporary `/dev/spike` route or standalone HTML page.
- [ ] Load `libheif-js` in a Web Worker.
- [ ] Decode one 12 MP HEIC and report:
  - [ ] width, height
  - [ ] orientation metadata
  - [ ] alpha presence
  - [ ] decode time
  - [ ] estimated decoded memory
- [ ] Decode a 48 MP HEIC and measure peak memory.
- [ ] Test orientation (`irot` / `imir` / EXIF).
- [ ] Test a transparent/alpha fixture.
- [ ] Test a corrupt file and a JPEG renamed to `.heic`.
- [ ] Encode the decoded image to JPEG, PNG, and WebP via `OffscreenCanvas`.
- [ ] Verify EXIF/GPS is absent from the re-encoded output.
- [ ] Run the spike in Chrome, Firefox, and Safari.
- [ ] If `libheif-js` is unworkable, spike `heic2any` and document the trade-off.

### Deliverables

- Spike page or test harness.
- Short findings note: decoder choice, timings, memory, browser gaps.

### Exit criteria

- At least JPG, PNG, and WebP outputs open correctly in an independent viewer.
- Orientation is correct.
- A 48 MP file completes on desktop without crashing.
- Go/no-go decision recorded.

**If no-go:** stop and revisit the decoder strategy before continuing.

---

## 7. Milestone 3 — Conversion engine

**Duration:** 3–4 days
**Goal:** A framework-independent, fully tested conversion engine.

### Tasks

- [ ] Create `src/engine/` with:
  - [ ] `types.ts` — options, metadata, errors
  - [ ] `validate.ts` — extension, MIME, `ftyp` brand checks
  - [ ] `decode.ts` — libheif wrapper
  - [ ] `transform.ts` — orientation and resize
  - [ ] `encode.ts` — JPEG/PNG/WebP
  - [ ] `metadata.ts` — EXIF read/strip
  - [ ] `errors.ts` — error codes and messages
- [ ] Implement quality mapping (10–100% → encoder quality).
- [ ] Implement resize presets: original, 1920, 1280, 800 max edge.
- [ ] Enforce PNG as lossless and ignore quality.
- [ ] Validate output: non-zero bytes, expected MIME, expected dimensions.
- [ ] Add unit tests for every module.
- [ ] Add fixture-based regression tests.

### Deliverables

- Engine usable without React.
- Unit-test suite.
- Documented public functions.

### Exit criteria

- All fixtures convert correctly.
- Invalid files fail with the documented error codes.
- Engine tests run in CI without a browser (except WASM-dependent tests, which
  run in Playwright).

---

## 8. Milestone 4 — Worker pool and scheduler

**Duration:** 3–4 days
**Goal:** Safe, cancellable batch processing with bounded memory.

### Tasks

- [ ] Implement worker entry point and Comlink RPC.
- [ ] Implement the worker message protocol from `architecture.md`.
- [ ] Create a two-worker pool with lazy creation.
- [ ] Recycle workers after 15 jobs or after a crash.
- [ ] Implement Zustand job store:
  - [ ] add, remove, clear
  - [ ] state transitions
  - [ ] progress updates per row
  - [ ] aggregate metrics
- [ ] Implement scheduler:
  - [ ] concurrency 2 desktop / 1 mobile
  - [ ] FIFO admission
  - [ ] memory budget check
  - [ ] cancellation of queued and active jobs
- [ ] Detect `navigator.deviceMemory` and reduce concurrency when low.
- [ ] Handle worker crash, timeout, and late responses.
- [ ] Add integration tests for queue order, cancellation, and memory rejection.

### Deliverables

- Working queue engine with no UI dependency.
- Integration tests.

### Exit criteria

- A 10-file batch completes without freezing the UI.
- A deliberately oversized job fails with `OUT_OF_MEMORY` instead of crashing.
- Cancelling an active job releases its worker and memory.

---

## 9. Milestone 5 — Workspace UI

**Duration:** 4–5 days
**Goal:** The complete single-file and batch experience.

### Tasks

- [ ] Dropzone:
  - [ ] drag and drop
  - [ ] file picker
  - [ ] paste support
  - [ ] drag-over visual state
- [ ] Validation feedback with the exact PRD toast copy.
- [ ] Controls:
  - [ ] segmented format selector
  - [ ] quality slider with percentage readout
  - [ ] resize dropdown
  - [ ] EXIF/GPS toggle (default ON)
- [ ] Queue:
  - [ ] thumbnail, filename, dimensions
  - [ ] before → after size
  - [ ] progress bar and state badge
  - [ ] individual download
  - [ ] remove and clear actions
- [ ] Summary bar: file count, total savings, download all.
- [ ] Empty, loading, error, and partial-failure states.
- [ ] Accessibility: keyboard dropzone, labels, ARIA live regions, focus order.
- [ ] Playwright E2E for one conversion per format.
- [ ] Visual check against the Stitch reference.

### Deliverables

- End-to-end usable converter.
- E2E tests.

### Exit criteria

- A non-technical user can convert a photo without instructions.
- All controls are keyboard accessible.
- No layout shift during conversion.

---

## 10. Milestone 6 — Batch exports

**Duration:** 2–3 days
**Goal:** ZIP and PDF downloads.

### Tasks

- [ ] ZIP with `fflate`:
  - [ ] include only `ready` jobs
  - [ ] sanitise filenames
  - [ ] resolve duplicate basenames
  - [ ] report skipped/failed jobs
  - [ ] name archive `clearheic-converted.zip`
- [ ] PDF with `jsPDF`:
  - [ ] A4 and US Letter
  - [ ] auto orientation
  - [ ] 10 mm margins
  - [ ] one image per page
  - [ ] release source blobs after build
- [ ] Add E2E tests for ZIP and PDF.
- [ ] Run a 30-file memory soak test.

### Deliverables

- Working ZIP and PDF exports.
- Soak-test results.

### Exit criteria

- ZIP opens correctly and contains the expected files and names.
- PDF opens and prints with correct page sizes.
- 30-file batch completes or fails gracefully without a tab crash.

---

## 11. Milestone 7 — SEO and content

**Duration:** 4–6 days (plus editorial time)
**Goal:** Indexable pages for the five routes and 100 articles.

### Tasks

- [ ] Write unique copy for each route: H1, intro, FAQ, default format.
- [ ] Configure pre-rendering at build time.
- [ ] Generate per-route:
  - [ ] title and meta description
  - [ ] canonical URL
  - [ ] Open Graph and Twitter tags
  - [ ] JSON-LD (`SoftwareApplication`, `FAQPage`, `HowTo`)
- [ ] Build the DOCX → MDX import script.
- [ ] Preserve the SEO brief as front matter.
- [ ] Generate one static page per article.
- [ ] Generate `sitemap.xml` and `robots.txt`.
- [ ] Add internal links from articles to converter routes.
- [ ] Add build-time checks for duplicate titles and canonicals.
- [ ] Editorial pass on the 100 drafts.
- [ ] Verify crawler output with `curl`.

### Deliverables

- Pre-rendered route pages.
- Pre-rendered article pages.
- Sitemap and robots file.
- Content review log.

### Exit criteria

- `curl` returns full HTML with the correct title/H1 before JS runs.
- Sitemap contains all published URLs.
- No duplicate titles or canonicals.
- Lighthouse SEO ≥ 95 on the five routes.

---

## 12. Milestone 8 — Hardening

**Duration:** 3–5 days
**Goal:** Cross-browser reliability, accessibility, security, and performance.

### Tasks

- [ ] Test Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome.
- [ ] Add WebP encode fallback and `OffscreenCanvas` fallback.
- [ ] Add a WebAssembly-unsupported message.
- [ ] Verify orientation, alpha, and EXIF stripping on every browser.
- [ ] Profile 30-file batch memory in DevTools.
- [ ] Resolve memory leaks and worker growth.
- [ ] Run Lighthouse performance, accessibility, SEO, best practices.
- [ ] Add `.htaccess` rules: rewrites, WASM MIME, caching, compression, headers.
- [ ] Add Content Security Policy.
- [ ] Run `npm audit` and dependency review.
- [ ] Run axe-core accessibility checks.
- [ ] Verify bundle-size budget.

### Deliverables

- Hardened production build.
- Browser test report.
- Performance report.

### Exit criteria

- Lighthouse SEO ≥ 95 and accessibility ≥ 95.
- No crashes in the 30-file test.
- No third-party runtime requests.
- CSP and headers verified with `curl -I`.

---

## 13. Milestone 9 — Deployment and launch

**Duration:** 1 day
**Goal:** Public launch on ClearHEIC.com.

### Tasks

- [ ] Build `dist/`.
- [ ] Upload to cPanel `public_html`.
- [ ] Verify HTTPS and redirects.
- [ ] Verify `.wasm` MIME type.
- [ ] Verify compression and cache headers.
- [ ] Test all five routes and a sample article on the live domain.
- [ ] Submit `sitemap.xml` to Google Search Console.
- [ ] Run one conversion on a phone and one on Windows.
- [ ] Confirm no network request carries image data.
- [ ] Publish a short privacy note explaining local processing.
- [ ] Tag the release and archive the build.

### Deliverables

- Live site.
- Search Console submission.
- Launch checklist completed.

### Exit criteria

- Production conversion works on desktop and mobile.
- No upload requests in the network panel.
- All routes return 200 and render correctly.

---

## 14. Verification matrix

| Area | Tool / method | When |
|---|---|---|
| Type safety | `tsc --noEmit` | Every commit |
| Lint | ESLint | Every commit |
| Unit tests | Vitest | Every commit |
| E2E | Playwright | Every milestone |
| Visual regression | Playwright screenshots | M5, M8 |
| Accessibility | axe-core + manual keyboard | M5, M8 |
| Performance | Lighthouse CI + DevTools | M6, M8 |
| Memory | 30-file soak test | M6, M8 |
| SEO | `curl`, sitemap validation, Lighthouse | M7, M8 |
| Security | `npm audit`, CSP check, network tab | M8, M9 |
| Privacy | Network panel inspection | M5, M9 |

---

## 15. Timeline

| Milestone | Duration | Cumulative |
|---|---|---|
| M0 Decisions and inputs | 0.5 day | 0.5 day |
| M1 Repo and shell | 1–2 days | 2.5 days |
| M2 Decode spike | 2–3 days | 5.5 days |
| M3 Engine | 3–4 days | 9.5 days |
| M4 Scheduler | 3–4 days | 13.5 days |
| M5 Workspace UI | 4–5 days | 18.5 days |
| M6 ZIP + PDF | 2–3 days | 21.5 days |
| M7 SEO + content | 4–6 days | 27.5 days |
| M8 Hardening | 3–5 days | 32.5 days |
| M9 Deploy | 1 day | 33.5 days |

Roughly **4–5 weeks** for one developer. Article editing can run in parallel
and is the most likely source of delay.

---

## 16. Risk register

| Risk | Trigger | Mitigation | Owner |
|---|---|---|---|
| Decoder fails on real iPhone files | M2 spike fails | Try `heic2any`, then evaluate alternative WASM builds | Engineer |
| Mobile tab crashes | OOM during batch | Concurrency 1, memory budget, downscale-first | Engineer |
| Safari canvas differences | WebP or OffscreenCanvas unsupported | Feature detect and fall back to JPG/main-thread canvas | Engineer |
| SEO underperforms | Pages not indexed | Pre-render, unique copy, sitemap, Search Console | Engineer + content |
| Article quality is thin | Editorial review | Rewrite intros/FAQs, add screenshots, verify claims | Content |
| cPanel header limits | CSP/COOP not applied | Verify with `curl -I`; simplify headers | Engineer |
| WASM bundle too large | Slow first conversion | Lazy-load, compress, cache, progress UI | Engineer |
| Scope creep | Multi-page PDF or 100-file requests | Keep v1 scope; log as post-launch backlog | PM |
| Unverified claims | Legal/compliance review | Remove "HIPAA/GDPR" and "100% lossless JPG" | PM |

---

## 17. Decision log

| ID | Decision | Date | Status |
|---|---|---|---|
| D-001 | Client-side conversion only | 2026-11-17 | Proposed |
| D-002 | Static hosting + pre-rendering | 2026-11-17 | Proposed |
| D-003 | Vite + React + TypeScript | 2026-11-17 | Proposed |
| D-004 | `libheif-js` as decoder | 2026-11-17 | Pending spike |
| D-005 | 30-file / 150 MB limit | 2026-11-17 | Proposed |
| D-006 | PDF v1 = one image per page | 2026-11-17 | Proposed |
| D-007 | `fflate` for ZIP | 2026-11-17 | Proposed |
| D-008 | No analytics in v1 | 2026-11-17 | Proposed |

---

## 18. Launch checklist

### Product

- [ ] Five converter routes work with the correct default format.
- [ ] JPG, PNG, WebP, and PDF outputs are valid.
- [ ] Batch ZIP works with 30 files.
- [ ] EXIF/GPS stripped by default.
- [ ] Errors are understandable and non-blocking.

### Engineering

- [ ] No runtime backend or upload requests.
- [ ] Production build has no source maps or secrets.
- [ ] `.htaccess` verified.
- [ ] CSP, caching, and compression verified.
- [ ] Bundle budget met.

### SEO

- [ ] All routes pre-rendered.
- [ ] All published articles pre-rendered.
- [ ] `sitemap.xml` and `robots.txt` live.
- [ ] Canonicals and titles unique.
- [ ] Search Console verified.

### Quality

- [ ] Browser matrix passed.
- [ ] Accessibility checks passed.
- [ ] 30-file soak test passed.
- [ ] Lighthouse thresholds met.

### Communications

- [ ] Privacy page published.
- [ ] Claims reviewed and accurate.
- [ ] Support/contact path available.

---

## 19. Post-launch backlog

- Multi-page PDF compiler with drag-to-reorder.
- Custom page margins and 300 DPI placement.
- PWA install and offline cache.
- AVIF output.
- HEIF sequence / Live Photo frame export.
- Shared design-system package for the other seven tools.
- Privacy-friendly aggregate analytics.
- Optional desktop wrapper if browser limits become blocking.

---

## 20. Definition of done

- A visitor can convert 30 HEIC photos and download them individually or as a
  ZIP, with no image data leaving the device.
- All five converter routes and published articles are pre-rendered and
  indexable.
- The engine is reusable outside React.
- The site passes the browser, accessibility, performance, and security gates.
- The launch checklist is complete.
