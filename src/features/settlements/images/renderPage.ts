import { fonts, tokens } from '../../../theme/tokens'
import type { ImagePage, ImageRow } from './buildImagePages'
import { truncateToWidth } from './truncateToWidth'

/** Layout happens at a 360 px logical width, scaled ×3: every image is 1080 px wide (design D3). */
export const LOGICAL_WIDTH = 360
export const SCALE = 3
export const IMAGE_WIDTH = LOGICAL_WIDTH * SCALE
export const PADDING = 20

/** The slice of a 2D context the renderer uses; `measureText` only needs `width`. */
type Ctx = Pick<
  CanvasRenderingContext2D,
  'scale' | 'fillRect' | 'fillText' | 'font' | 'fillStyle' | 'textAlign' | 'textBaseline'
> & { measureText(text: string): { width: number } }

export interface CanvasLike {
  width: number
  height: number
  getContext(type: '2d'): Ctx | null
}

const RIGHT = LOGICAL_WIDTH - PADDING
const CENTER = LOGICAL_WIDTH / 2
const ROW_GAP = 12
const HAIRLINE = 'rgba(243, 239, 230, 0.18)' // tokens.chalk at low alpha

const font = {
  heading: `700 22px ${fonts.display}`,
  title: `700 17px ${fonts.display}`,
  amount: `700 15px ${fonts.display}`,
  name: `600 15px ${fonts.body}`,
  body: `400 13px ${fonts.body}`,
  small: `400 12px ${fonts.body}`,
}

const rowHeight = (page: ImagePage) => (page.kind === 'contributions' ? 44 : 32)
const HEADER_HEIGHT = 20 + 30 + 22 + 30 // padding, heading, date, title
const FOOTER_HEIGHT = 16 + 14 + 20 // gap, footer line, bottom padding

/** Logical height: header, summary lines, rows and footer. */
export function pageHeight(page: ImagePage): number {
  const summary = page.summaryLines.length * 20
  const body = page.rows.length > 0 ? page.rows.length * rowHeight(page) : 28
  return HEADER_HEIGHT + summary + ROW_GAP + body + FOOTER_HEIGHT
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  style: string,
  color: string,
  align: CanvasTextAlign,
) {
  ctx.font = style
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(value, x, y)
}

function drawRow(ctx: Ctx, page: ImagePage, row: ImageRow, y: number) {
  ctx.font = font.amount
  const rightWidth = ctx.measureText(row.right).width
  text(
    ctx,
    row.right,
    RIGHT,
    page.kind === 'contributions' ? y + 8 : y,
    font.amount,
    tokens.chalk,
    'right',
  )

  ctx.font = font.name
  const nameMax = RIGHT - PADDING - rightWidth - 12
  const name = truncateToWidth(row.left, nameMax, (t) => ctx.measureText(t).width)
  text(ctx, name, PADDING, y, font.name, tokens.chalk, 'left')
  if (row.middle) text(ctx, row.middle, PADDING, y + 20, font.small, tokens.chalkMuted, 'left')
  ctx.fillStyle = HAIRLINE
  ctx.fillRect(PADDING, y + rowHeight(page) - 8, RIGHT - PADDING, 1)
}

/** Draws one page on the pizarra. Pure layout over a 2D context; no DOM access. */
export function renderPage(page: ImagePage, canvas: CanvasLike): void {
  const height = pageHeight(page)
  canvas.width = IMAGE_WIDTH
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.scale(SCALE, SCALE)
  ctx.textBaseline = 'top'

  ctx.fillStyle = tokens.pizarra
  ctx.fillRect(0, 0, LOGICAL_WIDTH, height)

  let y = 20
  text(ctx, page.heading, PADDING, y, font.heading, tokens.chalk, 'left')
  y += 30
  text(ctx, page.date, PADDING, y, font.body, tokens.chalkMuted, 'left')
  y += 22
  text(ctx, page.title, PADDING, y, font.title, tokens.chalk, 'left')
  if (page.pageLabel) {
    // Same line, right after the title: "Quién le transfiere a quién 1/2".
    ctx.font = font.title
    const labelX = PADDING + ctx.measureText(page.title).width + 6
    text(ctx, page.pageLabel, labelX, y, font.title, tokens.chalkMuted, 'left')
  }
  y += 30
  page.summaryLines.forEach((line, index) => {
    text(ctx, line, PADDING, y, font.body, index === 0 ? tokens.chalk : tokens.chalkMuted, 'left')
    y += 20
  })
  y += ROW_GAP

  for (const row of page.rows) {
    drawRow(ctx, page, row, y)
    y += rowHeight(page)
  }

  // Mandatory footer, centered at the bottom on every page (spec share-images).
  text(ctx, page.footer, CENTER, height - 20 - 14, font.small, tokens.chalkMuted, 'center')
}
