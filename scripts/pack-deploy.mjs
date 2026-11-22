/**
 * Packages the built dist/ directory as an upload-ready ZIP for cPanel.
 *
 * Run `npm run build` first. Unlike PowerShell's Compress-Archive, this uses
 * forward-slash entry names and includes hidden files such as .htaccess.
 *
 * Usage: npm run package
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { zipSync } from 'fflate'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = resolve(root, 'dist')
const output = resolve(root, 'clearheic-cpanel-upload.zip')

if (!statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error('dist/ not found — run npm run build first')
}

const files = {}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (entry.isFile()) {
      const name = relative(dist, full).split(sep).join('/')
      files[name] = new Uint8Array(readFileSync(full))
    }
  }
}

walk(dist)

const zip = zipSync(files, { level: 6 })
writeFileSync(output, zip)

const required = [
  '.htaccess',
  'index.html',
  'robots.txt',
  'sitemap.xml',
  'guides/index.html',
  'heic-to-jpg/index.html',
]
const missing = required.filter((name) => !files[name])
if (missing.length) throw new Error(`dist/ is missing: ${missing.join(', ')}`)

console.log(`wrote ${output} (${Object.keys(files).length} files, ${zip.length} bytes)`)
