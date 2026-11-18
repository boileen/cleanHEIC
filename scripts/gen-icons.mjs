/**
 * Regenerates the raster app icons from the vector brand mark.
 * Run: npm run brand:icons
 */
import { readFileSync } from 'node:fs'

import { chromium } from 'playwright'

const svg = readFileSync('public/brand/clearheic-mark.svg', 'utf8')

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 })

async function render(size, file, { bleed = false } = {}) {
  const markup = svg.replace('<svg ', `<svg width="${size}" height="${size}" `)
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div id="icon" style="width:${size}px;height:${size}px;${
      bleed ? 'background:#1D4ED8;' : ''
    }">${markup}</div></body></html>`,
  )
  await page.locator('#icon').screenshot({ path: file, omitBackground: !bleed })
  console.log(`wrote ${file} (${size}px${bleed ? ', full-bleed' : ', transparent'})`)
}

await render(180, 'public/apple-touch-icon.png', { bleed: true })
await render(192, 'public/icon-192.png', { bleed: true })
await render(512, 'public/icon-512.png', { bleed: true })
await render(32, 'public/favicon-32.png')

await browser.close()
