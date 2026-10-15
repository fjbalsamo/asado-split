import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../domain/fixtures/referenceAsado'
import type { Participant } from '../domain/models/participant'
import { buildImagePages, type ImagePage } from '../features/settlements/images/buildImagePages'
import { SHARE_STATUS_RESET_MS } from './useShareSummary'
import {
  DOWNLOAD_GAP_MS,
  PREBUILD_DELAY_MS,
  REVOKE_DELAY_MS,
  useShareImages,
  type ShareImagesDeps,
} from './useShareImages'

function page(fileName: string): ImagePage {
  return {
    kind: 'transfers',
    fileName,
    heading: 'Cuentas del asado',
    date: '15 de octubre de 2026',
    title: 'Quién le transfiere a quién',
    summaryLines: [],
    rows: [],
    footer: 'powered by fjbalsamo',
  }
}

const PAGES = [page('asado-transferencias-1.png'), page('asado-aportes-1.png')]

function deps(overrides: Partial<ShareImagesDeps> = {}) {
  const toFile = vi.fn(async (p: ImagePage) => new File(['png'], p.fileName, { type: 'image/png' }))
  const loadFonts = vi.fn(async () => {})
  return { toFile, loadFonts, ...overrides }
}

function stubShare(share: ReturnType<typeof vi.fn>, canShare = true) {
  vi.stubGlobal('navigator', { share, canShare: vi.fn(() => canShare) })
}

async function flushPrebuild() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(PREBUILD_DELAY_MS)
  })
}

async function tap(result: { current: ReturnType<typeof useShareImages> }) {
  await act(async () => {
    await result.current.share()
  })
}

describe('useShareImages', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('pre-builds the files 300 ms after the pages change', async () => {
    const toFile = vi.fn(async (p: ImagePage) => new File(['png'], p.fileName))
    const d = deps({ toFile })
    renderHook(() => useShareImages(PAGES, d))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PREBUILD_DELAY_MS - 1)
    })
    expect(toFile).not.toHaveBeenCalled()
    await flushPrebuild()
    expect(d.loadFonts).toHaveBeenCalled()
    expect(toFile.mock.calls.map(([p]) => p.fileName)).toEqual([
      'asado-transferencias-1.png',
      'asado-aportes-1.png',
    ])
  })

  it('shares the pre-built files in order without rebuilding', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)
    const d = deps()
    const { result } = renderHook(() => useShareImages(PAGES, d))
    await flushPrebuild()
    await tap(result)
    expect(d.toFile).toHaveBeenCalledTimes(2)
    const shared = share.mock.calls[0]?.[0] as ShareData
    expect(shared.title).toBe('Cuentas del asado')
    expect(shared.files?.map((f) => f.name)).toEqual([
      'asado-transferencias-1.png',
      'asado-aportes-1.png',
    ])
    expect(result.current.status).toBe('shared')
  })

  it('never lets a stale build replace a newer one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)
    let releaseOld: () => void = () => {}
    const oldGate = new Promise<void>((resolve) => (releaseOld = resolve))
    const toFile = vi.fn(async (p: ImagePage) => {
      if (p.fileName.startsWith('old')) await oldGate
      return new File(['png'], p.fileName)
    })
    const d = deps({ toFile })
    const { result, rerender } = renderHook(({ pages }) => useShareImages(pages, d), {
      initialProps: { pages: [page('old-1.png')] },
    })
    await flushPrebuild()
    rerender({ pages: [page('new-1.png')] })
    await flushPrebuild()
    releaseOld()
    await act(async () => {
      await Promise.resolve()
    })
    await tap(result)
    const shared = share.mock.calls[0]?.[0] as ShareData
    expect(shared.files?.map((f) => f.name)).toEqual(['new-1.png'])
  })

  it.each([
    ['a plain AbortError', Object.assign(new Error('cancel'), { name: 'AbortError' })],
    ['a real DOMException', new DOMException('cancel', 'AbortError')],
  ])('stays idle when the user cancels (%s)', async (_, error) => {
    stubShare(vi.fn().mockRejectedValue(error))
    const { result } = renderHook(() => useShareImages(PAGES, deps()))
    await flushPrebuild()
    await tap(result)
    expect(result.current.status).toBe('idle')
  })

  it('reports an error when sharing fails', async () => {
    stubShare(vi.fn().mockRejectedValue(new Error('NotAllowedError')))
    const { result } = renderHook(() => useShareImages(PAGES, deps()))
    await flushPrebuild()
    await tap(result)
    expect(result.current.status).toBe('error')
  })

  it('reports an error when the images cannot be built', async () => {
    stubShare(vi.fn().mockResolvedValue(undefined))
    const d = deps({ toFile: vi.fn().mockRejectedValue(new Error('no canvas')) })
    const { result } = renderHook(() => useShareImages(PAGES, d))
    await flushPrebuild()
    await tap(result)
    expect(result.current.status).toBe('error')
  })

  it('clears the message after 4 seconds and its timer on unmount', async () => {
    stubShare(vi.fn().mockResolvedValue(undefined))
    const { result, unmount } = renderHook(() => useShareImages(PAGES, deps()))
    await flushPrebuild()
    await tap(result)
    act(() => vi.advanceTimersByTime(SHARE_STATUS_RESET_MS))
    expect(result.current.status).toBe('idle')
    await tap(result)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

/** Real pages for the reference asado: one transfers page, then one contributions page. */
const REFERENCE_PAGES = buildImagePages({
  participants: referenceParticipants,
  total: referenceTotal,
  ...referenceSplit,
  balances: referenceBalances,
  transfers: referenceTransfers,
  today: new Date(2026, 9, 15),
})

const ofKind = (pages: ImagePage[], kind: ImagePage['kind']) => pages.filter((p) => p.kind === kind)

/** 15 participants: 2 transfers pages, then 2 contributions pages. */
function crowdPages() {
  const crowd: Participant[] = Array.from({ length: 15 }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    contribution: i === 0 ? 1500 : 0,
  }))
  return buildImagePages({
    participants: crowd,
    total: 1500,
    share: 100,
    surplus: 0,
    surplusRecipientId: null,
    balances: crowd.map((p, i) => ({ participantId: p.id, amount: i === 0 ? 1400 : -100 })),
    transfers: crowd.slice(1).map((p) => ({ from: p.id, to: 'p0', amount: 100 })),
    today: new Date(2026, 9, 15),
  })
}

/** Taps and lets the paced downloads run to completion under fake timers. */
async function tapAndRun(result: { current: ReturnType<typeof useShareImages> }) {
  await act(async () => {
    const done = result.current.share()
    await vi.advanceTimersByTimeAsync(DOWNLOAD_GAP_MS * 10)
    await done
  })
}

describe('useShareImages: real per-button payloads', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each([
    ['transfers', ['asado-transferencias-1.png']],
    ['contributions', ['asado-aportes-1.png']],
  ] as const)('the %s button shares only its own image', async (kind, expected) => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)
    const { result } = renderHook(() => useShareImages(ofKind(REFERENCE_PAGES, kind), deps()))
    await flushPrebuild()
    await tap(result)
    const files = (share.mock.calls[0]?.[0] as ShareData).files ?? []
    expect(files.map((f) => f.name)).toEqual(expected)
  })

  it('shares every transfers page in order and no contributions page', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)
    const { result } = renderHook(() => useShareImages(ofKind(crowdPages(), 'transfers'), deps()))
    await flushPrebuild()
    await tap(result)
    const files = (share.mock.calls[0]?.[0] as ShareData).files ?? []
    expect(files.map((f) => f.name)).toEqual([
      'asado-transferencias-1.png',
      'asado-transferencias-2.png',
    ])
  })
})

describe('useShareImages: download fallback', () => {
  let created: string[] = []
  let revoked: string[] = []
  let clicked: { name: string; revokedBefore: number }[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    created = []
    revoked = []
    clicked = []
    let n = 0
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => {
        const url = `blob:test-${++n}`
        created.push(url)
        return url
      }),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn((url: string) => void revoked.push(url)),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ name: this.download, revokedBefore: revoked.length })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("downloads only the button's own real image", async () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() =>
      useShareImages(ofKind(REFERENCE_PAGES, 'contributions'), deps()),
    )
    await flushPrebuild()
    await tapAndRun(result)
    expect(clicked.map((c) => c.name)).toEqual(['asado-aportes-1.png'])
    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
    expect(result.current.status).toBe('downloaded')
  })

  it('paces the downloads instead of firing them in the same instant', async () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useShareImages(REFERENCE_PAGES, deps()))
    await flushPrebuild()
    let done: Promise<void> = Promise.resolve()
    await act(async () => {
      done = result.current.share()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(clicked.map((c) => c.name)).toEqual(['asado-transferencias-1.png'])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DOWNLOAD_GAP_MS)
      await done
    })
    expect(clicked).toHaveLength(2)
  })

  it('keeps every download link valid until well after the last click', async () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useShareImages(REFERENCE_PAGES, deps()))
    await flushPrebuild()
    await tapAndRun(result)
    expect(clicked.every((c) => c.revokedBefore === 0)).toBe(true)
    expect(revoked).toEqual([])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVOKE_DELAY_MS)
    })
    expect(revoked).toEqual(created)
  })

  it.each([
    ['transfers', ['asado-transferencias-1.png', 'asado-transferencias-2.png']],
    ['contributions', ['asado-aportes-1.png', 'asado-aportes-2.png']],
  ] as const)('downloads every %s page of a 15-person asado in order', async (kind, expected) => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useShareImages(ofKind(crowdPages(), kind), deps()))
    await flushPrebuild()
    await tapAndRun(result)
    expect(clicked.map((c) => c.name)).toEqual(expected)
  })

  it('downloads when canShare rejects files', async () => {
    const share = vi.fn()
    stubShare(share, false)
    const { result } = renderHook(() => useShareImages(PAGES, deps()))
    await flushPrebuild()
    await tapAndRun(result)
    expect(share).not.toHaveBeenCalled()
    expect(clicked).toHaveLength(2)
    expect(result.current.status).toBe('downloaded')
  })

  it('builds on tap when the latest files are not ready yet', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)
    const toFile = vi.fn(async (p: ImagePage) => new File(['png'], p.fileName))
    const { result } = renderHook(() => useShareImages(PAGES, deps({ toFile })))
    await tap(result)
    expect(toFile).toHaveBeenCalledTimes(2)
    expect((share.mock.calls[0]?.[0] as ShareData).files).toHaveLength(2)
    expect(result.current.status).toBe('shared')
  })
})
