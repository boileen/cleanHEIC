import { expect, test } from '@playwright/test'

const routes = [
  { path: '/heic-to-jpg', h1: 'Convert HEIC to JPG Instantly' },
  { path: '/heic-to-png', h1: 'Convert HEIC to Lossless PNG' },
  { path: '/heic-to-webp', h1: 'Convert HEIC to WebP for Web & SEO' },
  { path: '/heic-to-pdf', h1: 'Convert iPhone HEIC Photos to PDF' },
]

for (const route of routes) {
  test(`${route.path} renders with its own heading and title`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: 'networkidle' })

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toBeVisible()
    await expect(page).toHaveTitle(/ClearHEIC/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${route.path}$`),
    )
  })
}

test('root redirects to the JPG converter', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/\/heic-to-jpg$/)
})

test('the old HEIF URL redirects to the JPG converter', async ({ page }) => {
  await page.goto('/heif-to-jpg', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/\/heic-to-jpg$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Convert HEIC to JPG Instantly' }),
  ).toBeVisible()
})

test('mobile navigation opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/heic-to-jpg', { waitUntil: 'networkidle' })

  const openButton = page.getByRole('button', { name: 'Open navigation menu' })
  await openButton.click()
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )

  await page.getByRole('navigation', { name: 'Converter formats' }).last().getByRole('link', { name: 'HEIC to PNG' }).click()
  await expect(page).toHaveURL(/\/heic-to-png$/)
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible()
})

test('invalid route shows the not-found page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1, name: 'That page does not exist' })).toBeVisible()
})
