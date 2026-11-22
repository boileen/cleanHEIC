/**
 * Imports a curated set of the 100 SEO drafts from ClearHEIC_100_SEO_Articles.zip
 * into src/content/articles/ as Markdown with front matter.
 *
 * The drafts are generated and share a lot of boilerplate. This importer drops
 * the SEO brief, repeated filler paragraphs and placeholder sections, then
 * appends a verified ClearHEIC section. Imported files are reviewed content,
 * not raw drafts — but every article still starts with `published: true` only
 * after the curation decision below. Flip the flag to false to unpublish one.
 *
 * Usage: node scripts/import-articles.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { unzipSync } from 'fflate'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const archive = resolve(root, 'ClearHEIC_100_SEO_Articles.zip')
const outDir = resolve(root, 'src/content/articles')

// 12 curated topics: distinct search intents, no near-duplicates.
const selected = [
  { file: '002_', slug: 'convert-heic-to-jpg-online-safely', converter: '/heic-to-jpg' },
  { file: '005_', slug: 'heic-to-jpg-without-renaming-extension', converter: '/heic-to-jpg' },
  { file: '007_', slug: 'heic-to-jpg-original-resolution', converter: '/heic-to-jpg' },
  { file: '009_', slug: 'heic-unsupported-image-uploads', converter: '/heic-to-jpg' },
  { file: '011_', slug: 'heic-to-jpg-on-iphone', converter: '/heic-to-jpg' },
  { file: '014_', slug: 'convert-multiple-iphone-heic-photos', converter: '/heic-to-jpg' },
  { file: '021_', slug: 'heic-to-jpg-on-windows-11', converter: '/heic-to-jpg' },
  { file: '044_', slug: 'heic-to-jpg-zip-download', converter: '/heic-to-jpg' },
  { file: '061_', slug: 'how-to-convert-heic-to-png', converter: '/heic-to-png' },
  { file: '062_', slug: 'how-to-convert-heic-to-pdf', converter: '/heic-to-pdf' },
  { file: '064_', slug: 'how-to-convert-heic-to-webp', converter: '/heic-to-webp' },
  { file: '075_', slug: 'remove-gps-from-heic-and-jpg', converter: '/heic-to-jpg' },
]

const formatLabel = {
  '/heic-to-jpg': 'JPG',
  '/heic-to-png': 'PNG',
  '/heic-to-webp': 'WebP',
  '/heic-to-pdf': 'PDF',
}

function decode(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function paragraphs(xml) {
  return [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
    .map((match) => ({
      style: (match[1].match(/<w:pStyle w:val="([^"]+)"/) ?? [])[1] ?? '-',
      text: decode(
        [...match[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
          .map((t) => t[1])
          .join(''),
      ).trim(),
    }))
    .filter((paragraph) => paragraph.text.length > 0)
}

// Repeated across nearly every draft — remove so articles stay distinct.
const filler = [
  /^For this particular task—/,
  /^The central distinction in /,
  /^Readers in the United States/,
  /^Editorial note:/,
  /^Do not assume batch conversion/,
  /^Visit https:\/\/clearheic\.com\/ to see which conversion options/,
]

// These draft sections are instructions to an editor, not article content.
const placeholderSections = new Set([
  'Where ClearHEIC.com fits',
  'Suggested internal links (verify pages exist)',
  'Editorial references',
  'Suggested internal links',
])

const subSections = new Set([
  'Step-by-step workflow',
  'Frequently asked questions',
  'How this applies to your situation',
])

const topLevelSections = new Set([
  'Quick answer',
  'Step-by-step workflow',
  'How this applies to your situation',
  'When should you keep HEIC?',
  'Common mistakes to avoid',
  'Frequently asked questions',
  'Final checklist',
])

function toMarkdown(paragraphsList) {
  const start = paragraphsList.findIndex(
    (p) => p.style === 'Heading1' && p.text === 'Article',
  )
  if (start === -1) throw new Error('Could not find the Article marker')

  const lines = []
  let skipping = false
  let section = ''
  let isFirstBodyParagraph = true
  let isQuickAnswer = false

  for (const paragraph of paragraphsList.slice(start + 1)) {
    if (paragraph.style === 'Heading2') {
      skipping = placeholderSections.has(paragraph.text)
      if (!skipping) {
        const isTop = topLevelSections.has(paragraph.text) || paragraph.text.startsWith('Choosing ')
        const nested = !isTop && (subSections.has(section) || /^Step \d+:/.test(paragraph.text))
        const level = nested ? '###' : '##'
        if (!nested) section = paragraph.text
        if (lines.length && lines[lines.length - 1] !== '') lines.push('')
        lines.push(`${level} ${paragraph.text}`, '')
        isQuickAnswer = paragraph.text === 'Quick answer'
      }
      continue
    }
    if (skipping || filler.some((pattern) => pattern.test(paragraph.text))) continue

    if (isFirstBodyParagraph) {
      isFirstBodyParagraph = false
      lines.push(
        'Converting HEIC photos is not simply a case of changing a file extension. The goal is an image your destination can actually open, at a sensible quality, without losing the original. This guide covers the practical checks and common mistakes that cause avoidable problems.',
        '',
      )
      continue
    }

    let text = paragraph.text
    if (isQuickAnswer) {
      isQuickAnswer = false
      text = text.replace(/^For [^,]+, /, '')
      text = text.charAt(0).toUpperCase() + text.slice(1)
    }

    if (paragraph.style === 'ListBullet') {
      lines.push(`- ${text}`)
    } else {
      lines.push(text, '')
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function cleanDescription(title) {
  const text = `${title}. Practical steps, checks and common fixes. Private, in-browser conversion with ClearHEIC.`
  if (text.length <= 155) return text
  return `${title}. Steps and fixes for private, in-browser conversion with ClearHEIC.`
}

function frontMatter(article, others) {
  const related = others
    .filter((other) => other.slug !== article.slug && other.converter === article.converter)
    .slice(0, 3)
    .map((other) => other.slug)

  const quote = (value) => `"${value.replace(/"/g, '\\"')}"`
  return [
    '---',
    `title: ${quote(article.title)}`,
    `description: ${quote(article.description)}`,
    `slug: ${quote(article.slug)}`,
    `converter: ${quote(article.converter)}`,
    'published: true',
    `related: [${related.map(quote).join(', ')}]`,
    '---',
    '',
  ].join('\n')
}

function productSection(converter) {
  const label = formatLabel[converter]
  return [
    '## Convert with ClearHEIC',
    '',
    `ClearHEIC converts ${label} files entirely in your browser — there is no upload, no account and no server copy of your photos. Queue up to 30 HEIC files (150 MB total), adjust quality from 10% to 100%, set a maximum edge for web or email, and download each result or the whole batch as a ZIP. EXIF and GPS metadata are removed automatically from every output file.`,
    '',
    `[Open the HEIC to ${label} converter](${converter})`,
    '',
  ].join('\n')
}

const zip = unzipSync(new Uint8Array(readFileSync(archive)))

mkdirSync(outDir, { recursive: true })

for (const item of selected) {
  const entry = Object.keys(zip).find(
    (key) => key.includes(item.file) && key.endsWith('.docx'),
  )
  if (!entry) throw new Error(`Missing draft ${item.file} in ${archive}`)

  const xml = new TextDecoder().decode(unzipSync(zip[entry])['word/document.xml'])
  const blocks = paragraphs(xml)

  const valueAfter = (label) => {
    const index = blocks.findIndex((p) => p.text === label)
    return index === -1 ? '' : blocks[index + 1]?.text ?? ''
  }

  const title = valueAfter('SEO title') || blocks[0]?.text || item.slug
  const article = {
    ...item,
    title,
    description: cleanDescription(title),
  }

  const markdown = [
    frontMatter(article, selected),
    `# ${article.title}`,
    '',
    toMarkdown(blocks),
    '',
    productSection(article.converter),
  ].join('\n')

  writeFileSync(resolve(outDir, `${item.slug}.md`), markdown, 'utf8')
  console.log(`imported ${item.slug}.md`)
}

console.log(`\n${selected.length} articles imported into src/content/articles/`)
