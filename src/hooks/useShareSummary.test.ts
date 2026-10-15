import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SHARE_STATUS_RESET_MS, useShareSummary } from './useShareSummary'

const TEXT = 'Cuentas del asado'

function abortError(): Error {
  const error = new Error('Share canceled')
  error.name = 'AbortError'
  return error
}

function stubNavigator(nav: { share?: unknown; clipboard?: unknown }) {
  vi.stubGlobal('navigator', nav)
}

async function share(result: { current: ReturnType<typeof useShareSummary> }) {
  await act(async () => {
    await result.current.share()
  })
}

describe('useShareSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts idle', () => {
    stubNavigator({})
    const { result } = renderHook(() => useShareSummary(TEXT))
    expect(result.current.status).toBe('idle')
  })

  it('uses the native share sheet when available', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    stubNavigator({ share: nativeShare, clipboard: { writeText } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(nativeShare).toHaveBeenCalledWith({ text: TEXT })
    expect(writeText).not.toHaveBeenCalled()
    expect(result.current.status).toBe('shared')
  })

  it('stays idle and copies nothing when the user cancels the share sheet', async () => {
    const writeText = vi.fn()
    stubNavigator({ share: vi.fn().mockRejectedValue(abortError()), clipboard: { writeText } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(writeText).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('treats a real DOMException AbortError as a cancel: idle, not error', async () => {
    const writeText = vi.fn()
    stubNavigator({
      share: vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError')),
      clipboard: { writeText },
    })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(result.current.status).toBe('idle')
    expect(result.current.status).not.toBe('error')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('clears a previous message when the next share is cancelled', async () => {
    const nativeShare = vi
      .fn()
      .mockRejectedValueOnce(new Error('NotAllowedError'))
      .mockRejectedValueOnce(new DOMException('Share canceled', 'AbortError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share: nativeShare, clipboard: { writeText } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(result.current.status).toBe('copied')
    await share(result)
    expect(result.current.status).toBe('idle')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('falls back to the clipboard when native share fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({
      share: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      clipboard: { writeText },
    })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(writeText).toHaveBeenCalledWith(TEXT)
    expect(result.current.status).toBe('copied')
  })

  it('copies to the clipboard when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ clipboard: { writeText } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(writeText).toHaveBeenCalledWith(TEXT)
    expect(result.current.status).toBe('copied')
  })

  it('reports an error when nothing works', async () => {
    stubNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(result.current.status).toBe('error')
  })

  it('reports an error when neither API exists', async () => {
    stubNavigator({})
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    expect(result.current.status).toBe('error')
  })

  it('clears the message after 4 seconds', async () => {
    stubNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    act(() => vi.advanceTimersByTime(SHARE_STATUS_RESET_MS - 1))
    expect(result.current.status).toBe('copied')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.status).toBe('idle')
  })

  it('restarts the 4 second window on a new share', async () => {
    stubNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { result } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    act(() => vi.advanceTimersByTime(3000))
    await share(result)
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.status).toBe('copied')
  })

  it('shares the latest text', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share: nativeShare })
    const { result, rerender } = renderHook(({ text }) => useShareSummary(text), {
      initialProps: { text: 'v1' },
    })
    rerender({ text: 'v2' })
    await share(result)
    expect(nativeShare).toHaveBeenCalledWith({ text: 'v2' })
  })

  it('clears its timer on unmount', async () => {
    stubNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { result, unmount } = renderHook(() => useShareSummary(TEXT))
    await share(result)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
