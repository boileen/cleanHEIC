export type PageSize = 'a4' | 'letter'

export interface PageDimensions {
  width: number
  height: number
}

/** Physical page sizes in millimetres. */
export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
}

export const DEFAULT_MARGIN_MM = 10

/** Rotates the page so a portrait photo gets a portrait page and vice versa. */
export function orientPage(
  size: PageSize,
  imageWidth: number,
  imageHeight: number,
): PageDimensions {
  const page = PAGE_SIZES[size]
  const short = Math.min(page.width, page.height)
  const long = Math.max(page.width, page.height)

  return imageWidth > imageHeight
    ? { width: long, height: short }
    : { width: short, height: long }
}

export interface Placement {
  x: number
  y: number
  width: number
  height: number
}

/** Fits an image inside the page margins and centres it without cropping. */
export function fitOnPage(
  page: PageDimensions,
  imageWidth: number,
  imageHeight: number,
  margin = DEFAULT_MARGIN_MM,
): Placement {
  const availableWidth = Math.max(1, page.width - margin * 2)
  const availableHeight = Math.max(1, page.height - margin * 2)
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight)

  const width = imageWidth * scale
  const height = imageHeight * scale

  return {
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
  }
}
