import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'
import exifr from 'exifr'

const fixture = fileURLToPath(new URL('../fixtures/heic_test.heic', import.meta.url))

test('converts real HEIC photos, strips metadata and bundles a ZIP', async ({ page }, testInfo) => {
  test.setTimeout(180_000)

  const dir = mkdtempSync(join(tmpdir(), 'clearheic-e2e-'))
  const first = join(dir, 'IMG_9001.HEIC')
  const second = join(dir, 'IMG_9002.HEIC')
  copyFileSync(fixture, first)
  copyFileSync(fixture, second)

  await page.goto('/heic-to-jpg')
  await page.locator('#workspace input[type="file"]').setInputFiles([first, second])

  await page.getByRole('button', { name: 'Convert photos' }).click()
  await expect(page.getByText('Done', { exact: true })).toHaveCount(2, { timeout: 150_000 })
  await expect(page.getByText(/2 of 2 converted/)).toBeVisible()
  await expect(page.getByText(/3024×4032/).first()).toBeVisible()

  const single = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).first().click()
  const download = await single
  expect(download.suggestedFilename()).toMatch(/^IMG_900[12]\.jpg$/)

  const jpgPath = testInfo.outputPath(download.suggestedFilename())
  await download.saveAs(jpgPath)

  const metadata = await exifr.parse(jpgPath, { gps: true })
  expect(metadata?.latitude).toBeUndefined()
  expect(metadata?.longitude).toBeUndefined()
  expect(metadata?.Make).toBeUndefined()
  expect(metadata?.DateTimeOriginal).toBeUndefined()

  const zip = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download all \(2\)/ }).click()
  expect((await zip).suggestedFilename()).toMatch(/^clearheic-jpg-\d{4}-\d{2}-\d{2}\.zip$/)
})

test('reports a corrupt HEIC as a per-file error and keeps the batch usable', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'clearheic-e2e-'))
  const corrupt = join(dir, 'BROKEN.HEIC')
  writeFileSync(corrupt, Buffer.from([0, 1, 2, 3, 4]))

  await page.goto('/heic-to-jpg')
  await page.locator('#workspace input[type="file"]').setInputFiles([corrupt])
  await page.getByRole('button', { name: 'Convert photos' }).click()

  await expect(page.getByText('Failed', { exact: true })).toBeVisible({ timeout: 90_000 })
  await expect(page.getByText(/could not be decoded/)).toBeVisible()
})

test('rejects .heif uploads with a clear message', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'clearheic-e2e-'))
  const heif = join(dir, 'IMG_8100.heif')
  copyFileSync(fixture, heif)

  await page.goto('/heic-to-jpg')
  await page.locator('#workspace input[type="file"]').setInputFiles([heif])

  await expect(
    page.getByText('1 file skipped — only .HEIC files are supported.'),
  ).toBeVisible()
  await expect(
    page.getByText('No photos yet — drop files above to build your batch.'),
  ).toBeVisible()
})

const imageOutputs = [
  { path: '/heic-to-png', extension: 'png' },
  { path: '/heic-to-webp', extension: 'webp' },
]

for (const output of imageOutputs) {
  test(`converts a real HEIC to ${output.extension.toUpperCase()} with valid file bytes`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)

    const dir = mkdtempSync(join(tmpdir(), 'clearheic-e2e-'))
    const source = join(dir, 'IMG_7100.HEIC')
    copyFileSync(fixture, source)

    await page.goto(output.path)
    await page.locator('#workspace input[type="file"]').setInputFiles([source])
    await page.getByRole('button', { name: 'Convert photos' }).click()

    await expect(page.getByText('Done', { exact: true })).toBeVisible({ timeout: 150_000 })
    await expect(page.getByText(/3024×4032/).first()).toBeVisible()

    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download', exact: true }).first().click()
    const download = await pending

    expect(download.suggestedFilename()).toBe(`IMG_7100.${output.extension}`)
    const outputPath = testInfo.outputPath(download.suggestedFilename())
    await download.saveAs(outputPath)

    const bytes = readFileSync(outputPath)

    if (output.extension === 'png') {
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(bytes.readUInt32BE(16)).toBe(3024)
      expect(bytes.readUInt32BE(20)).toBe(4032)
    } else {
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes.subarray(12, 16).toString()).toMatch(/^VP8[X L]$/)

      // Chrome writes the extended VP8X container; decode it back in the
      // browser to prove the bytes are a real image at the right size.
      const size = await page.evaluate(async (base64) => {
        const binary = atob(base64)
        const buffer = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
          buffer[index] = binary.charCodeAt(index)
        }
        const bitmap = await createImageBitmap(new Blob([buffer], { type: 'image/webp' }))
        return { width: bitmap.width, height: bitmap.height }
      }, bytes.toString('base64'))

      expect(size).toEqual({ width: 3024, height: 4032 })
    }

    expect(bytes.length).toBeGreaterThan(100_000)
  })
}
