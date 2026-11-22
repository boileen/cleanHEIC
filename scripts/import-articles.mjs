/**
 * Imports a curated set of the 100 SEO drafts from ClearHEIC_100_SEO_Articles.zip
 * into src/content/articles/ as Markdown with front matter.
 *
 * The drafts are generated and share a lot of boilerplate. This importer drops
 * the SEO brief, repeated filler and placeholder sections, then replaces the
 * generic shared paragraphs with topic- and format-specific copy. Imported
 * files are reviewed content, not raw drafts; flip `published` to false to
 * unpublish one.
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

/*
 * Editorial copy written during review. The draft ZIP supplies the workflow
 * skeleton and headings; these fields replace the boilerplate that appeared
 * identically in all 100 drafts.
 */
const topics = {
  'convert-heic-to-jpg-online-safely': {
    description: 'Convert HEIC to JPG online without uploading private photos. Safety checks, output verification and a private in-browser option.',
    intro: 'Uploading a photo to an unknown converter is the privacy risk most people overlook. A safe workflow checks where the file is processed, what the service keeps, and whether the output is a real JPEG before you share it.',
    quick: 'Use a converter that processes files in your browser or clearly explains its deletion policy, keep the original HEIC, and open the downloaded JPG in an independent viewer before sharing.',
    faqQuestion: 'Is it safe to convert private photos online?',
    faqAnswer: 'It depends on where decoding happens. A browser-based tool never receives the file; an upload service does, so read its retention policy before using it for anything sensitive.',
  },
  'heic-to-jpg-without-renaming-extension': {
    description: 'Why renaming a HEIC file to .jpg does not convert it, and how to create a genuine JPEG that upload forms accept.',
    intro: 'Renaming IMG_1234.heic to .jpg changes the label, not the image. Many upload errors come from this shortcut, so it is worth understanding what a real conversion does.',
    quick: 'Decode the HEIC and encode a new JPEG. The result should open in an independent viewer, report JPEG in its file properties, and have a different name from the original.',
    faqQuestion: 'Why does renaming a HEIC file to .jpg fail?',
    faqAnswer: 'The file still contains HEIC-compressed image data. Software that reads the content rather than the extension rejects it.',
  },
  'heic-to-jpg-original-resolution': {
    description: 'Convert HEIC to JPG at original resolution. Check pixel dimensions, avoid silent resizing and verify the output before uploading.',
    intro: 'A converted photo can look fine on screen yet fail a form because it was quietly resized. Preserving the original resolution starts with checking the source dimensions and the tool defaults.',
    quick: 'Keep the resolution setting at its original or full-size option, convert, then compare the pixel dimensions of the output with the HEIC source before uploading.',
    faqQuestion: 'How do I confirm the JPG kept its original resolution?',
    faqAnswer: 'Check the pixel dimensions in a viewer or file inspector. If they are smaller than the source, the tool applied a resize preset.',
  },
  'heic-unsupported-image-uploads': {
    description: 'Fix HEIC unsupported image upload errors. Convert to a real JPEG, check format and size limits, then retry with confidence.',
    intro: 'An unsupported image error usually means the uploader wants JPEG data and received HEIC. The filename is rarely the real problem; the encoded format is.',
    quick: 'Convert the HEIC to a real JPEG, check the reported file type and dimensions, then retry the upload. If it still fails, look at size and dimension limits.',
    faqQuestion: 'Why does my photo upload say unsupported image?',
    faqAnswer: 'Most web forms accept JPEG or PNG only. HEIC uses a different codec and is rejected unless the site explicitly supports it.',
  },
  'heic-to-jpg-on-iphone': {
    description: 'Convert HEIC to JPG on iPhone and iPad. Change capture settings, export existing photos and verify the resulting JPEG.',
    intro: 'iPhone photos are commonly saved as HEIC, which is efficient on the device but awkward elsewhere. You can change future capture settings or export compatible copies of photos you already have.',
    quick: 'On the iPhone, Settings > Camera > Formats can switch future captures to Most Compatible. For existing HEIC photos, export or convert a separate JPEG copy and keep the original.',
    faqQuestion: 'Can I convert HEIC photos on an iPhone?',
    faqAnswer: 'You can change the camera format for future shots or use the export options in Photos. Browser-based converters also work once the HEIC files are on the device or a computer.',
  },
  'convert-multiple-iphone-heic-photos': {
    description: 'Convert multiple iPhone HEIC photos to JPG safely. Pilot batches, naming tips and limits that keep a large conversion manageable.',
    intro: 'Converting one photo is easy; converting a whole album is where limits and naming mistakes show up. A small pilot batch tells you whether the settings are right before you process everything.',
    quick: 'Test two or three photos first, confirm the output format and dimensions, then run the rest in batches that fit the file-count and size limits of your converter.',
    faqQuestion: 'What is the safest way to convert a whole HEIC album?',
    faqAnswer: 'Run a small pilot, keep the originals, and use a converter that processes batches locally so you are not uploading an entire photo library.',
  },
  'heic-to-jpg-on-windows-11': {
    description: 'Convert HEIC to JPG on Windows 11. Understand codec support, create a genuine JPEG and verify it before sharing.',
    intro: 'Windows 11 can display some HEIC photos once the right codec is installed, but codec support is not the same as having a JPEG. Forms and older software still need a real converted file.',
    quick: 'Install codec support if you only need to view HEIC on the desktop. To share or upload, convert to JPEG and check the output in File Explorer’s properties dialog.',
    faqQuestion: 'Does Windows 11 convert HEIC to JPG by itself?',
    faqAnswer: 'It can decode HEIC for viewing with the right codecs, but viewing is not conversion. You still need an export step to create a JPEG file.',
  },
  'heic-to-jpg-zip-download': {
    description: 'Convert HEIC to JPG and download the batch as a ZIP. Check contents, naming and image quality before sharing.',
    intro: 'A ZIP is the practical way to move a batch of converted photos without attaching dozens of files. It is worth checking what the archive contains before you send it.',
    quick: 'Convert the batch, download the ZIP, then inspect the archive for the expected number of files and extensions before sharing it.',
    faqQuestion: 'What should I check in a ZIP of converted photos?',
    faqAnswer: 'Confirm the file count, extensions and that a sample image opens. A ZIP produced in the browser involves no server copy of your photos.',
  },
  'how-to-convert-heic-to-png': {
    description: 'Convert HEIC to PNG with no upload. Learn when lossless PNG is useful, what to expect for file size and how to verify the result.',
    intro: 'PNG is the right choice when you need lossless output or transparent areas. It is not a magic quality boost; it represents the decoded image data differently from HEIC or JPEG.',
    quick: 'Decode the HEIC and export a PNG. Expect a larger file, no lossy compression, and no quality setting to adjust.',
    faqQuestion: 'Is PNG better than JPG for HEIC photos?',
    faqAnswer: 'PNG preserves the decoded pixels exactly and supports transparency, but files are much larger. JPG is usually the better choice for everyday photos.',
  },
  'how-to-convert-heic-to-pdf': {
    description: 'Convert HEIC to PDF in your browser. Choose page size, keep images legible and verify the document before sharing.',
    intro: 'PDF turns one or more photos into a document you can attach, print or sign. The image is still a raster picture inside the file, so resolution and page size matter.',
    quick: 'Choose PDF as the output, pick a page size, convert, then open the document to confirm every page is legible and in the right order.',
    faqQuestion: 'When should I save HEIC photos as a PDF?',
    faqAnswer: 'Use PDF when you need a document for printing, signing or archiving a set of pages rather than a single editable image.',
  },
  'how-to-convert-heic-to-webp': {
    description: 'Convert HEIC to WebP for faster web images. Learn quality settings, browser support and when to keep a JPG fallback.',
    intro: 'WebP is designed for web delivery: smaller files at comparable visual quality. Converting HEIC to WebP works well for sites, but the format is not accepted everywhere yet.',
    quick: 'Export WebP for web use, choose a quality setting, and keep a JPG version for destinations that do not accept WebP.',
    faqQuestion: 'Is WebP supported everywhere?',
    faqAnswer: 'Modern browsers support it, but some older apps and upload forms do not. Keep a JPG copy when compatibility matters.',
  },
  'remove-gps-from-heic-and-jpg': {
    description: 'Remove GPS and EXIF data from HEIC and JPG photos. Verify that location fields are gone before sharing images online.',
    intro: 'A photo can reveal where it was taken even after it has been resized. Removing GPS and EXIF data is a separate concern from changing the file format.',
    quick: 'Re-encode the image rather than editing metadata in place, then inspect the exported file with a metadata viewer to confirm location fields are gone.',
    faqQuestion: 'Does converting a photo remove its GPS data?',
    faqAnswer: 'A converter that rebuilds the image from decoded pixels strips embedded metadata. A tool that edits metadata in place may not.',
  },
}

const formatLabel = {
  '/heic-to-jpg': 'JPG',
  '/heic-to-png': 'PNG',
  '/heic-to-webp': 'WebP',
  '/heic-to-pdf': 'PDF',
}

const qualityCopy = {
  '/heic-to-jpg': ' adjust quality from 10% to 100%,',
  '/heic-to-webp': ' adjust quality from 10% to 100%,',
  '/heic-to-pdf': ' choose JPEG quality for images inside the PDF,',
  '/heic-to-png': '',
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
  // Identical in all 12 drafts, and covered by each article's own step 1.
  'Choosing JPG, PNG, PDF or the original HEIC',
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

function toMarkdown(paragraphsList, article) {
  const start = paragraphsList.findIndex(
    (p) => p.style === 'Heading1' && p.text === 'Article',
  )
  if (start === -1) throw new Error('Could not find the Article marker')

  const topic = topics[article.slug]
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
      lines.push(topic.intro, '')
      continue
    }

    if (isQuickAnswer) {
      isQuickAnswer = false
      lines.push(topic.quick, '')
      continue
    }

    if (paragraph.style === 'ListBullet') {
      lines.push(`- ${paragraph.text}`)
    } else {
      lines.push(paragraph.text, '')
    }
  }
  return polish(lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), article)
}

/* Replace the last shared boilerplate: format-specific FAQ/checklist wording. */
function polish(markdown, article) {
  const topic = topics[article.slug]
  const label = formatLabel[article.converter]
  // The draft prose says "JPEG"; keep that spelling in body copy even though
  // the route and page title use "JPG".
  const proseLabel = label === 'JPG' ? 'JPEG' : label

  let text = markdown.replace(
    /### Can I use a free tool for [^\n]+\?\n\nPossibly\. First review[^\n]*/,
    `### ${topic.faqQuestion}\n\n${topic.faqAnswer}`,
  )

  text = text
    .replace(
      'Not necessarily. JPEG compression and colour processing can change pixels, even when the image has the same dimensions. Test an output at your intended viewing size.',
      label === 'PNG'
        ? 'PNG preserves the decoded pixels exactly, but colour management and orientation can still change how the image appears. Test an output at your intended viewing size.'
        : label === 'PDF'
          ? 'The images inside a PDF are usually JPEG-compressed, so pixels can change slightly. Open the document at full size to check legibility.'
          : `${proseLabel} compression and colour processing can change pixels, even when the image has the same dimensions. Test an output at your intended viewing size.`,
    )
    .replace(
      '### Will changing the extension from HEIC to JPG work?\n\nNo. An extension rename does not perform image decoding and JPEG encoding.',
      `### Will changing the extension from HEIC to ${proseLabel} work?\n\nNo. An extension rename does not perform image decoding and ${proseLabel} encoding.`,
    )
    .replace(
      'do not become JPEG merely because the suffix is changed',
      `do not become ${proseLabel} merely because the suffix is changed`,
    )
    .replace(
      'A new JPEG may be resized, recompressed or missing metadata',
      `A new ${proseLabel} may be resized or missing metadata`,
    )
    .replace(
      'A technically valid JPEG still may fail a portal',
      `A technically valid ${proseLabel} still may fail a portal`,
    )
    .replace(
      'Confirm the file really is JPEG, then check size, dimensions, colour mode, corruption',
      `Confirm the file really is ${proseLabel}, then check size, dimensions, colour mode, corruption`,
    )
    .replace(
      '- Export is genuine JPEG or the explicitly requested format',
      `- Export is a genuine ${proseLabel} file`,
    )
    // ClearHEIC has no AVIF output; do not suggest it as a ClearHEIC option.
    .replace('WebP or AVIF can suit web delivery', 'WebP can suit web delivery')

  if (label === 'PNG') {
    text = text.replace(
      'Choose quality, pixel size, colour mode, page size or transparency based on the output format.',
      'Choose pixel size and transparency based on your needs. PNG is lossless, so there is no quality setting to adjust.',
    )
  }

  return text
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
    `ClearHEIC converts HEIC photos to ${label} entirely in your browser — there is no upload, no account and no server copy of your photos. Queue up to 30 HEIC files (150 MB total), set a maximum edge for web or email,${qualityCopy[converter]} and download each result or the whole batch as a ZIP. EXIF and GPS metadata are removed automatically from every output file.`,
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
    description: topics[item.slug].description,
  }

  const markdown = [
    frontMatter(article, selected),
    `# ${article.title}`,
    '',
    toMarkdown(blocks, article),
    '',
    productSection(article.converter),
  ].join('\n')

  writeFileSync(resolve(outDir, `${item.slug}.md`), markdown, 'utf8')
  console.log(`imported ${item.slug}.md`)
}

console.log(`\n${selected.length} articles imported into src/content/articles/`)
