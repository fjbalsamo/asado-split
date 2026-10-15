import { fonts } from '../../../theme/tokens'
import type { ImagePage } from './buildImagePages'
import { renderPage } from './renderPage'

/**
 * Makes sure the self-hosted Bitter 700 is ready before drawing, so images never fall back to
 * another font (design D3). A no-op where the Font Loading API is missing.
 */
export async function loadImageFonts(): Promise<void> {
  const fontSet = document.fonts as FontFaceSet | undefined
  if (!fontSet) return
  await fontSet.load(`700 20px ${fonts.display}`)
  await fontSet.ready
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not encode the image as PNG'))
    }, 'image/png')
  })
}

/** Draws one page and wraps it as a PNG `File` named after the page. */
export async function pageToFile(page: ImagePage): Promise<File> {
  const canvas = document.createElement('canvas')
  renderPage(page, canvas)
  const blob = await canvasToPng(canvas)
  return new File([blob], page.fileName, { type: 'image/png' })
}
