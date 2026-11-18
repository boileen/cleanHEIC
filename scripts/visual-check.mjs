/**
 * Visual QA pass for ClearHEIC.
 *
 * Requires the dev server: `npm run dev`
 * Run: `npm run visual:check`
 *
 * For every route it checks for horizontal overflow at four widths and writes
 * full-page screenshots to `.visual/`.
 */
import { chromium } from 'playwright'

const BASE = process.env.VISUAL_BASE_URL ?? 'http://127.0.0.1:5173'
const OUT = '.visual'
const ROUTES = ['/heic-to-jpg', '/heic-to-png', '/heic-to-webp', '/heic-to-pdf']
const WIDTHS = [
  { width: 1200, label: 'desktop' },
  { width: 1024, label: 'laptop' },
  { width: 768, label: 'tablet' },
  { width: 390, label: 'mobile' },
]

const browser = await chromium.launch({ channel: 'chrome' })
let problems = 0

for (const { width, label } of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })

    const result = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const offenders = []
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0) continue
        const scrollableParent = el.closest('.overflow-x-auto')
        if (scrollableParent) continue
        if (rect.right > vw + 1 || rect.left < -1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            right: Math.round(rect.right),
          })
        }
      }
      return { scrollW: document.documentElement.scrollWidth, vw, offenders }
    })

    const overflow = result.scrollW > result.vw || result.offenders.length > 0
    if (overflow) problems += 1
    const slug = route.replace(/\//g, '') || 'root'
    await page.screenshot({ path: `${OUT}/${label}-${slug}.png`, fullPage: true })

    console.log(
      `${overflow ? 'FAIL' : 'ok  '} ${label.padEnd(7)} ${route.padEnd(13)} ` +
        `scrollWidth=${result.scrollW} viewport=${result.vw}` +
        (overflow ? ` offenders=${JSON.stringify(result.offenders.slice(0, 3))}` : ''),
    )
  }

  await page.close()
}

await browser.close()
console.log(problems === 0 ? '\nNo horizontal overflow detected.' : `\n${problems} overflow problem(s).`)
process.exitCode = problems === 0 ? 0 : 1
