const ELLIPSIS = '…'

/**
 * Shortens `text` with "…" so it fits `maxWidth` as measured by `measure`
 * (the canvas `measureText` in production). Binary search on the kept prefix length.
 */
export function truncateToWidth(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string {
  if (measure(text) <= maxWidth) return text
  if (measure(ELLIPSIS) > maxWidth) return ''
  let low = 0
  let high = text.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (measure(text.slice(0, mid).trimEnd() + ELLIPSIS) <= maxWidth) low = mid
    else high = mid - 1
  }
  return text.slice(0, low).trimEnd() + ELLIPSIS
}
