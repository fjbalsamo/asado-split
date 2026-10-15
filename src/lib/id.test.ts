import { afterEach, describe, expect, it, vi } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns different non-empty ids', () => {
    const a = createId()
    const b = createId()
    expect(a).not.toBe('')
    expect(a).not.toBe(b)
  })

  it('falls back when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})
    const ids = new Set(Array.from({ length: 100 }, () => createId()))
    expect(ids.size).toBe(100)
    expect([...ids].every((id) => id.length > 0)).toBe(true)
  })
})
