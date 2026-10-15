import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../../../domain/fixtures/referenceAsado'
import { buildImagePages, type ImagePage } from './buildImagePages'
import { loadImageFonts, pageToFile } from './pageToFile'

const [page] = buildImagePages({
  participants: referenceParticipants,
  total: referenceTotal,
  ...referenceSplit,
  balances: referenceBalances,
  transfers: referenceTransfers,
  today: new Date(2026, 9, 15),
}) as [ImagePage]

function stubCanvas(blob: Blob | null = new Blob(['png'], { type: 'image/png' })) {
  const ctx = {
    scale: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 7 }),
    font: '',
    fillStyle: '',
    textAlign: 'left',
    textBaseline: 'top',
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    callback: BlobCallback,
  ) {
    callback(blob)
  })
  return { ctx, toBlob }
}

describe('pageToFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders the page and returns a PNG file named after it', async () => {
    const { ctx, toBlob } = stubCanvas()
    const file = await pageToFile(page)
    expect(file.name).toBe('asado-transferencias-1.png')
    expect(file.type).toBe('image/png')
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png')
    expect(ctx.fillText).toHaveBeenCalledWith(
      'powered by fjbalsamo',
      expect.any(Number),
      expect.any(Number),
    )
  })

  it('rejects when the canvas cannot encode a PNG', async () => {
    stubCanvas(null)
    await expect(pageToFile(page)).rejects.toThrow()
  })
})

describe('loadImageFonts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(document, 'fonts')
  })

  it('loads Bitter 700 and waits for fonts to be ready before drawing', async () => {
    const load = vi.fn().mockResolvedValue([])
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load, ready: Promise.resolve() },
    })
    await loadImageFonts()
    expect(load).toHaveBeenCalledWith(expect.stringMatching(/^700 .*Bitter/))
  })

  it('does not fail where the Font Loading API is missing', async () => {
    await expect(loadImageFonts()).resolves.toBeUndefined()
  })
})
