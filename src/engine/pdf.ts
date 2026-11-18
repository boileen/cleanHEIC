import type { PageSize } from './pdf-layout'
import { DEFAULT_MARGIN_MM, fitOnPage, orientPage } from './pdf-layout'

export interface PdfImage {
  blob: Blob
  width: number
  height: number
}

export interface PdfOptions {
  pageSize: PageSize
  marginMm?: number
}

const DOCUMENT_NAME = 'clearheic-document.pdf'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the converted photo.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Builds a PDF with one JPEG per page. jsPDF is imported lazily so the main
 * bundle stays small and the library is only fetched when someone exports.
 */
export async function buildPdf(images: PdfImage[], options: PdfOptions): Promise<Blob> {
  if (images.length === 0) {
    throw new Error('There are no photos to include in the PDF.')
  }

  const { jsPDF } = await import('jspdf')
  const margin = options.marginMm ?? DEFAULT_MARGIN_MM

  const firstPage = orientPage(options.pageSize, images[0].width, images[0].height)
  const doc = new jsPDF({
    orientation: firstPage.width > firstPage.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [firstPage.width, firstPage.height],
    compress: true,
  })

  for (const [index, image] of images.entries()) {
    const page = orientPage(options.pageSize, image.width, image.height)
    if (index > 0) {
      doc.addPage([page.width, page.height], page.width > page.height ? 'landscape' : 'portrait')
    }

    const placement = fitOnPage(page, image.width, image.height, margin)
    const dataUrl = await blobToDataUrl(image.blob)
    doc.addImage(
      dataUrl,
      'JPEG',
      placement.x,
      placement.y,
      placement.width,
      placement.height,
    )
  }

  doc.setProperties({
    title: 'ClearHEIC PDF',
    creator: 'ClearHEIC',
    author: 'ClearHEIC',
  })

  return doc.output('blob')
}

export function pdfFilename(): string {
  return DOCUMENT_NAME
}
