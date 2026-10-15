import { useCallback, useEffect, useRef, useState } from 'react'

export type ShareStatus = 'idle' | 'shared' | 'copied' | 'error'

export interface UseShareSummaryResult {
  status: ShareStatus
  share: () => Promise<void>
}

/** How long a share outcome stays visible before returning to idle. */
export const SHARE_STATUS_RESET_MS = 4000

/** Duck-typed: DOMException is not an Error subclass in every engine (e.g. jsdom). */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}

/**
 * Shares `text` with the native share sheet, falling back to the clipboard.
 * Exposes the outcome as `status` for inline feedback; a cancelled share stays idle.
 */
export function useShareSummary(text: string): UseShareSummaryResult {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((next: ShareStatus) => {
    clearTimeout(resetTimer.current)
    resetTimer.current = undefined
    setStatus(next)
    if (next !== 'idle') {
      resetTimer.current = setTimeout(() => setStatus('idle'), SHARE_STATUS_RESET_MS)
    }
  }, [])

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const share = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text })
        show('shared')
        return
      } catch (error) {
        if (isAbortError(error)) {
          show('idle')
          return
        }
      }
    }
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('No clipboard')
      await navigator.clipboard.writeText(text)
      show('copied')
    } catch {
      show('error')
    }
  }, [text, show])

  return { status, share }
}
