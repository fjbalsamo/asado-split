import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../../../domain/fixtures/referenceAsado'
import type { Participant } from '../../../domain/models/participant'
import { tokens } from '../../../theme/tokens'
import { buildImagePages, type ImagePage, type ImagePagesInput } from './buildImagePages'
import {
  IMAGE_WIDTH,
  LOGICAL_WIDTH,
  PADDING,
  renderPage,
  SCALE,
  type CanvasLike,
} from './renderPage'

interface TextCall {
  text: string
  x: number
  y: number
  font: string
  fillStyle: string
  textAlign: CanvasTextAlign
}

/** Fake 2D context: records draws with the state in effect; 7 px per character. */
function fakeCanvas() {
  const texts: TextCall[] = []
  const rects: { x: number; y: number; w: number; h: number; fillStyle: string }[] = []
  const scales: [number, number][] = []
  const ctx = {
    font: '',
    fillStyle: '' as string,
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    scale: (x: number, y: number) => void scales.push([x, y]),
    fillRect: (x: number, y: number, w: number, h: number) =>
      void rects.push({ x, y, w, h, fillStyle: ctx.fillStyle }),
    fillText: (text: string, x: number, y: number) =>
      void texts.push({
        text,
        x,
        y,
        font: ctx.font,
        fillStyle: ctx.fillStyle,
        textAlign: ctx.textAlign,
      }),
    measureText: (text: string) => ({ width: text.length * 7 }),
  }
  const canvas: CanvasLike = { width: 0, height: 0, getContext: () => ctx }
  return { canvas, texts, rects, scales }
}

const input: ImagePagesInput = {
  participants: referenceParticipants,
  total: referenceTotal,
  ...referenceSplit,
  balances: referenceBalances,
  transfers: referenceTransfers,
  today: new Date(2026, 9, 15),
}
const pages = buildImagePages(input)
const transfersPage = pages[0] as ImagePage
const contributionsPage = pages[1] as ImagePage

function render(page: ImagePage) {
  const fake = fakeCanvas()
  renderPage(page, fake.canvas)
  return fake
}

describe('renderPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([1, 2, 3])('is always 1080 px wide at scale 3 (devicePixelRatio %i)', (dpr) => {
    vi.stubGlobal('devicePixelRatio', dpr)
    const { canvas, scales } = render(transfersPage)
    expect(IMAGE_WIDTH).toBe(1080)
    expect(canvas.width).toBe(1080)
    expect(scales).toEqual([[SCALE, SCALE]])
    expect(canvas.height % SCALE).toBe(0)
  })

  it('paints the pizarra background over the whole image first', () => {
    const { canvas, rects } = render(transfersPage)
    expect(rects[0]).toEqual({
      x: 0,
      y: 0,
      w: LOGICAL_WIDTH,
      h: canvas.height / SCALE,
      fillStyle: tokens.pizarra,
    })
  })

  it('draws the header, every transfer row and amounts in Bitter', () => {
    const { texts } = render(transfersPage)
    const drawn = texts.map((t) => t.text)
    expect(drawn).toEqual(
      expect.arrayContaining([
        transfersPage.heading,
        transfersPage.date,
        transfersPage.title,
        ...transfersPage.rows.flatMap((r) => [r.left, r.right]),
      ]),
    )
    for (const row of transfersPage.rows) {
      const amount = texts.find((t) => t.text === row.right)
      expect(amount?.font).toContain('Bitter')
    }
    expect(texts.find((t) => t.text === 'Cuentas del asado')?.font).toContain('Bitter')
  })

  it('draws the contributions summary lines and every row part', () => {
    const drawn = render(contributionsPage).texts.map((t) => t.text)
    expect(drawn).toEqual(
      expect.arrayContaining([
        ...contributionsPage.summaryLines,
        ...contributionsPage.rows.flatMap((r) => [r.left, r.middle, r.right]),
      ]),
    )
  })

  it.each(pages.map((p) => [p.fileName, p] as const))(
    'draws the footer centered at the bottom in chalkMuted on %s',
    (_, page) => {
      const { canvas, texts } = render(page)
      const footer = texts.filter((t) => t.text === 'powered by fjbalsamo')
      expect(footer).toHaveLength(1)
      expect(footer[0]?.textAlign).toBe('center')
      expect((footer[0]?.x ?? 0) * SCALE).toBe(540)
      expect(footer[0]?.fillStyle).toBe(tokens.chalkMuted)
      const lowest = Math.max(...texts.map((t) => t.y))
      expect(footer[0]?.y).toBe(lowest)
      expect(footer[0]?.y).toBeLessThan(canvas.height / SCALE)
    },
  )

  it('draws the page label right after the title, on the same line', () => {
    const paged = { ...transfersPage, pageLabel: '1/2' }
    const { texts } = render(paged)
    const title = texts.find((t) => t.text === 'Quién le transfiere a quién')
    const label = texts.find((t) => t.text === '1/2')
    expect(title && label).toBeTruthy()
    expect(label?.textAlign).toBe('left')
    expect(label?.y).toBe(title?.y)
    expect(label?.x).toBeGreaterThan((title?.x ?? 0) + 'Quién le transfiere a quién'.length * 7)
    expect(label?.x).toBeLessThan((title?.x ?? 0) + 'Quién le transfiere a quién'.length * 7 + 16)
  })

  it('draws the footer on every page of a paginated set', () => {
    const crowd: Participant[] = Array.from({ length: 15 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      contribution: i === 0 ? 1500 : 0,
    }))
    const paged = buildImagePages({
      ...input,
      participants: crowd,
      total: 1500,
      share: 100,
      surplus: 0,
      surplusRecipientId: null,
      balances: crowd.map((p, i) => ({ participantId: p.id, amount: i === 0 ? 1400 : -100 })),
      transfers: crowd.slice(1).map((p) => ({ from: p.id, to: 'p0', amount: 100 })),
    })
    expect(paged).toHaveLength(4)
    for (const page of paged) {
      expect(render(page).texts.filter((t) => t.text === 'powered by fjbalsamo')).toHaveLength(1)
    }
  })

  it('never draws text past the side margins and shortens long names', () => {
    const longName = 'a'.repeat(40)
    const [page] = buildImagePages({
      ...input,
      participants: [{ id: 'x', name: longName, contribution: 0 }],
      total: 0,
      share: 0,
      surplus: 0,
      surplusRecipientId: null,
      balances: [{ participantId: 'x', amount: 0 }],
      transfers: [],
    })
    const { texts } = render(page as ImagePage)
    expect(texts.some((t) => t.text.endsWith('…'))).toBe(true)
    expect(texts.some((t) => t.text === longName)).toBe(false)
    for (const t of texts) {
      const width = t.text.length * 7
      const start =
        t.textAlign === 'right' ? t.x - width : t.textAlign === 'center' ? t.x - width / 2 : t.x
      expect(start).toBeGreaterThanOrEqual(PADDING)
      expect(start + width).toBeLessThanOrEqual(LOGICAL_WIDTH - PADDING)
    }
  })
})
