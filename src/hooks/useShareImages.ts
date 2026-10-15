import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImagePage } from '../features/settlements/images/buildImagePages'
import { loadImageFonts, pageToFile } from '../features/settlements/images/pageToFile'
import { SHARE_STATUS_RESET_MS } from './useShareSummary'

export type ShareImagesStatus = 'idle' | 'shared' | 'downloaded' | 'error'

export interface UseShareImagesResult {
  status: ShareImagesStatus
  share: () => Promise<void>
}

export interface ShareImagesDeps {
  toFile?: (page: ImagePage) => Promise<File>
  loadFonts?: () => Promise<void>
}

/** Debounce before pre-building files after the results change (design D4). */
export const PREBUILD_DELAY_MS = 300

interface Built {
  pages: readonly ImagePage[]
  files: File[]
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}

/** Pause between downloads: some browsers keep only the last of several instant downloads. */
export const DOWNLOAD_GAP_MS = 250
/** Object URLs are released only after this delay, so no download loses its file. */
export const REVOKE_DELAY_MS = 10_000

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Fallback where files cannot be shared: one paced download per file, in share order. */
async function downloadFiles(files: readonly File[]): Promise<void> {
  const urls: string[] = []
  for (const [index, file] of files.entries()) {
    if (index > 0) await pause(DOWNLOAD_GAP_MS)
    const url = URL.createObjectURL(file)
    urls.push(url)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
  setTimeout(() => urls.forEach((url) => URL.revokeObjectURL(url)), REVOKE_DELAY_MS)
}

/**
 * Shares the result images as PNG files. Files are pre-built in the background so the tap can
 * call `navigator.share` immediately (iOS needs the share to follow the tap closely).
 */
export function useShareImages(
  pages: readonly ImagePage[],
  deps: ShareImagesDeps = {},
): UseShareImagesResult {
  const [{ toFile, loadFonts }] = useState(() => ({
    toFile: deps.toFile ?? pageToFile,
    loadFonts: deps.loadFonts ?? loadImageFonts,
  }))
  const [status, setStatus] = useState<ShareImagesStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestPages = useRef(pages)
  const built = useRef<Built | null>(null)
  const generation = useRef(0)

  const show = useCallback((next: ShareImagesStatus) => {
    clearTimeout(resetTimer.current)
    resetTimer.current = undefined
    setStatus(next)
    if (next !== 'idle') {
      resetTimer.current = setTimeout(() => setStatus('idle'), SHARE_STATUS_RESET_MS)
    }
  }, [])

  const build = useCallback(
    async (target: readonly ImagePage[]): Promise<File[]> => {
      await loadFonts()
      return Promise.all(target.map((page) => toFile(page)))
    },
    [loadFonts, toFile],
  )

  useEffect(() => {
    latestPages.current = pages
    const current = ++generation.current
    const timer = setTimeout(() => {
      build(pages)
        .then((files) => {
          if (current === generation.current) built.current = { pages, files }
        })
        .catch(() => {
          // A failed pre-build is retried on tap, which reports the error.
        })
    }, PREBUILD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [pages, build])

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const share = useCallback(async () => {
    const target = latestPages.current
    if (target.length === 0) return
    let files: File[]
    try {
      files = built.current?.pages === target ? built.current.files : await build(target)
    } catch {
      show('error')
      return
    }
    if (typeof navigator.share !== 'function' || !navigator.canShare?.({ files })) {
      try {
        await downloadFiles(files)
        show('downloaded')
      } catch {
        show('error')
      }
      return
    }
    try {
      await navigator.share({ files, title: 'Cuentas del asado' })
      show('shared')
    } catch (error) {
      show(isAbortError(error) ? 'idle' : 'error')
    }
  }, [build, show])

  return { status, share }
}
