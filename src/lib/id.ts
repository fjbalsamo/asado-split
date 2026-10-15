let counter = 0

/** Unique participant id. Uses crypto.randomUUID (secure contexts) with a non-crypto fallback. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  counter += 1
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2)}`
}
