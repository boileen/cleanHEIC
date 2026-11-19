export type OutputFormat = 'jpg' | 'png' | 'webp' | 'pdf'

export interface ConverterRoute {
  path: string
  navLabel: string
  h1: string
  h1Accent: string
  intro: string
  keyword: string
  defaultFormat: OutputFormat
  metaTitle: string
  metaDescription: string
  highlights: string[]
}

export const converterRoutes: ConverterRoute[] = [
  {
    path: '/heic-to-jpg',
    navLabel: 'HEIC to JPG',
    h1: 'Convert HEIC to JPG Instantly',
    h1Accent: 'HEIC to JPG',
    intro:
      'Turn Apple iPhone and iPad .heic photos into universal JPG files inside your browser.',
    keyword: 'heic to jpg',
    defaultFormat: 'jpg',
    metaTitle: 'HEIC to JPG Converter — Free & Private | ClearHEIC',
    metaDescription:
      'Convert HEIC to JPG free in your browser. Batch up to 30 photos, control quality, strip GPS metadata, and download instantly. No uploads.',
    highlights: [
      'Batch up to 30 photos',
      'EXIF & GPS removed automatically',
      'Works on Windows, Mac, Android & iOS',
    ],
  },
  {
    path: '/heic-to-png',
    navLabel: 'HEIC to PNG',
    h1: 'Convert HEIC to Lossless PNG',
    h1Accent: 'HEIC to PNG',
    intro:
      'Extract pixel-perfect PNGs with alpha transparency from Portrait photos, stickers, and iPhone captures. Lossless output, processed locally in your browser.',
    keyword: 'heic to png',
    defaultFormat: 'png',
    metaTitle: 'HEIC to PNG Converter — Lossless & Private | ClearHEIC',
    metaDescription:
      'Convert HEIC to lossless PNG in your browser. Preserve alpha transparency from iPhone portraits and stickers. No uploads, no accounts.',
    highlights: [
      'Preserves alpha channels',
      'Lossless DEFLATE compression',
      'Ideal for Figma, Canva & slide decks',
    ],
  },
  {
    path: '/heic-to-webp',
    navLabel: 'HEIC to WebP',
    h1: 'Convert HEIC to WebP for Web & SEO',
    h1Accent: 'HEIC to WebP',
    intro:
      'Shrink iPhone photos into lightweight WebP images for faster websites, better Core Web Vitals, and lower bandwidth costs — all locally in your browser.',
    keyword: 'heic to webp',
    defaultFormat: 'webp',
    metaTitle: 'HEIC to WebP Converter — Faster Websites | ClearHEIC',
    metaDescription:
      'Convert HEIC to WebP in your browser. Resize for web, choose lossy or lossless, strip metadata, and download optimized images. No uploads.',
    highlights: [
      'Lossy or lossless WebP',
      'Resize for web, blog & mobile',
      'Strips metadata for smaller files',
    ],
  },
  {
    path: '/heic-to-pdf',
    navLabel: 'HEIC to PDF',
    h1: 'Convert iPhone HEIC Photos to PDF',
    h1Accent: 'HEIC Photos to PDF',
    intro:
      'Compile receipts, document scans, ID cards, and photo pages into clean, printable PDF files without sending sensitive records to a server.',
    keyword: 'heic to pdf',
    defaultFormat: 'pdf',
    metaTitle: 'HEIC to PDF Converter — Private Document Export | ClearHEIC',
    metaDescription:
      'Convert iPhone HEIC photos and document scans to PDF in your browser. A4 or US Letter, print-ready, and completely private. No uploads.',
    highlights: [
      'A4 & US Letter page sizes',
      'Auto portrait or landscape',
      'Sensitive documents stay local',
    ],
  },
]

export const formatRoutes: Record<OutputFormat, string> = {
  jpg: '/heic-to-jpg',
  png: '/heic-to-png',
  webp: '/heic-to-webp',
  pdf: '/heic-to-pdf',
}

export const formatLabels: Record<OutputFormat, string> = {
  jpg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  pdf: 'PDF',
}

export function getConverterRoute(pathname: string): ConverterRoute {
  return converterRoutes.find((route) => route.path === pathname) ?? converterRoutes[0]
}
