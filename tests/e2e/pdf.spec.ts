import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const fixture = fileURLToPath(new URL('../fixtures/heic_test.heic', import.meta.url))

function pageCount(bytes: Buffer): number {
  return (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length
}

function mediaBoxes(bytes: Buffer): Array<{ width: number; height: number }> {
  return Array.from(
    bytes.toString('latin1').matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g),
  ).map((match) => ({ width: Number(match[1]), height: Number(match[2]) }))
}

test('builds a two-page A4 PDF and a single-page PDF per row', async ({ page }, testInfo) => {
  test.setTimeout(180_000)

  const dir = mkdtempSync(join(tmpdir(), 'clearheic-pdf-'))
  const first = join(dir, 'IMG_9001.HEIC')
  const second = join(dir, 'IMG_9002.HEIC')
  copyFileSync(fixture, first)
  copyFileSync(fixture, second)

  await page.goto('/heic-to-pdf')
  await page.locator('#workspace input[type="file"]').setInputFiles([first, second])
  await page.getByRole('button', { name: 'Convert photos' }).click()

  const documentButton = page.getByRole('button', { name: /Download PDF \(2 pages\)/ })
  await expect(documentButton).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText('Done', { exact: true })).toHaveCount(2)

  const combined = page.waitForEvent('download')
  await documentButton.click()
  const download = await combined
  expect(download.suggestedFilename()).toBe('clearheic-document.pdf')

  const documentPath = testInfo.outputPath('clearheic-document.pdf')
  await download.saveAs(documentPath)
  const bytes = readFileSync(documentPath)

  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pageCount(bytes)).toBe(2)

  const boxes = mediaBoxes(bytes)
  expect(boxes).toHaveLength(2)
  for (const box of boxes) {
    expect(box.width).toBeCloseTo(595.28, 0)
    expect(box.height).toBeCloseTo(841.89, 0)
  }

  const single = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).first().click()
  const rowDownload = await single
  expect(rowDownload.suggestedFilename()).toBe('IMG_9001.pdf')

  const rowPath = testInfo.outputPath('IMG_9001.pdf')
  await rowDownload.saveAs(rowPath)
  expect(pageCount(readFileSync(rowPath))).toBe(1)
})

test('uses US Letter when selected', async ({ page }, testInfo) => {
  test.setTimeout(120_000)

  const dir = mkdtempSync(join(tmpdir(), 'clearheic-pdf-'))
  const source = join(dir, 'IMG_9100.HEIC')
  copyFileSync(fixture, source)

  await page.goto('/heic-to-pdf')
  await page.getByLabel('Page size').selectOption('letter')
  await page.locator('#workspace input[type="file"]').setInputFiles([source])
  await page.getByRole('button', { name: 'Convert photos' }).click()

  const documentButton = page.getByRole('button', { name: /Download PDF \(1 page\)/ })
  await expect(documentButton).toBeVisible({ timeout: 120_000 })

  const pending = page.waitForEvent('download')
  await documentButton.click()
  const download = await pending
  const outputPath = testInfo.outputPath('letter.pdf')
  await download.saveAs(outputPath)

  const boxes = mediaBoxes(readFileSync(outputPath))
  expect(boxes).toHaveLength(1)
  expect(boxes[0].width).toBeCloseTo(612, 0)
  expect(boxes[0].height).toBeCloseTo(792, 0)
})

test('exports the successful pages when one file is corrupt', async ({ page }) => {
  test.setTimeout(120_000)

  const dir = mkdtempSync(join(tmpdir(), 'clearheic-pdf-'))
  const good = join(dir, 'IMG_9200.HEIC')
  const corrupt = join(dir, 'BROKEN.HEIC')
  copyFileSync(fixture, good)
  writeFileSync(corrupt, Buffer.from([0, 1, 2, 3, 4]))

  await page.goto('/heic-to-pdf')
  await page.locator('#workspace input[type="file"]').setInputFiles([good, corrupt])
  await page.getByRole('button', { name: 'Convert photos' }).click()

  await expect(page.getByText('Failed', { exact: true })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText('Done', { exact: true })).toHaveCount(1, { timeout: 120_000 })
  await expect(
    page.getByRole('button', { name: /Download PDF \(1 page\)/ }),
  ).toBeVisible({ timeout: 120_000 })
})
