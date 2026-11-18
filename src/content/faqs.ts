import type { ConverterRoute } from '@/app/routes'

export interface FaqItem {
  question: string
  answer: string
}

const routeFaqs: Record<string, FaqItem> = {
  '/heic-to-jpg': {
    question: 'Why does my iPhone save photos as HEIC instead of JPG?',
    answer:
      'Since iOS 11, Apple has used HEIC as the default camera format because it stores roughly the same visual quality at about half the file size of JPG. The trade-off is compatibility: Windows, Android, and many web forms cannot open HEIC without extra software or paid codec packs, which is why converting to JPG is usually the simplest fix.',
  },
  '/heic-to-png': {
    question: 'Does PNG preserve transparency from iPhone Portrait photos?',
    answer:
      'PNG supports 32-bit RGBA, so alpha channels and transparent cutouts survive the conversion. That makes PNG the better choice for Portrait depth effects, stickers, and graphics that need a transparent background. Note that transparent cutouts only exist if the HEIC file actually contains an alpha channel — a standard photo does not.',
  },
  '/heic-to-webp': {
    question: 'Will WebP images work in every browser?',
    answer:
      'WebP is supported by current versions of Chrome, Edge, Firefox, Safari, and their mobile counterparts. If a target platform needs maximum compatibility — for example an older intranet portal or a government upload form — JPG remains the safer choice.',
  },
  '/heic-to-pdf': {
    question: 'Are my documents uploaded to a server?',
    answer:
      'No. The PDF is compiled in your browser, and the source photos never leave your device. There is no upload endpoint, no account, and no cloud copy. That makes ClearHEIC suitable for receipts, ID cards, and other sensitive paperwork.',
  },
}

const sharedFaqs: FaqItem[] = [
  {
    question: 'Are my photos uploaded to any server or cloud database?',
    answer:
      'No. Conversion runs entirely in your browser using WebAssembly, so the decoder reads the file from local memory. There is no upload endpoint, no account, and no cloud copy of your images. You can confirm this in your browser’s Network tab.',
  },
  {
    question: 'Does converting HEIC to JPG reduce photo quality?',
    answer:
      'JPG is a lossy format, so some compression is unavoidable. ClearHEIC defaults to 85%, which is visually close to the original at a much smaller size. If you need pixel-exact output for archival or print, choose PNG, which is always lossless.',
  },
  {
    question: 'Can I convert multiple HEIC photos at the same time?',
    answer:
      'Yes. You can queue up to 30 photos with a 150 MB total limit. Files are processed a few at a time rather than all at once, which keeps the tab responsive and memory usage predictable.',
  },
  {
    question: 'How do I open HEIC files on Windows without paying for extensions?',
    answer:
      'Windows needs a paid codec pack from the Microsoft Store to open HEIC files. Converting the photos to JPG here gives you files that open in any Windows app without installing anything.',
  },
  {
    question: 'Does ClearHEIC work offline?',
    answer:
      'The conversion itself happens locally, so no image ever needs a network connection. Whether the page loads without a connection depends on your browser cache; the tool is designed to keep all processing on your device.',
  },
  {
    question: 'Can I keep my original HEIC files?',
    answer:
      'Yes. ClearHEIC creates new output files and leaves your originals untouched. Keep the HEIC versions as your archival copy.',
  },
]

export function getFaqs(route: ConverterRoute): FaqItem[] {
  const specific = routeFaqs[route.path]
  return specific ? [specific, ...sharedFaqs] : sharedFaqs
}
