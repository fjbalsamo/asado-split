// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { truncateToWidth } from './truncateToWidth'

/** Fake monospace font: every character is 10 px wide. */
const measure = (text: string) => text.length * 10

describe('truncateToWidth', () => {
  it('leaves text that fits unchanged', () => {
    expect(truncateToWidth('Franco', 60, measure)).toBe('Franco')
    expect(truncateToWidth('Franco', 200, measure)).toBe('Franco')
  })

  it('shortens long text with an ellipsis', () => {
    expect(truncateToWidth('El Pelado de la esquina', 100, measure)).toBe('El Pelado…')
  })

  it('never returns text wider than the limit', () => {
    const name = 'a'.repeat(40)
    for (let max = 10; max <= 400; max += 7) {
      expect(measure(truncateToWidth(name, max, measure))).toBeLessThanOrEqual(max)
    }
  })

  it('returns just the ellipsis or nothing when space is tiny', () => {
    expect(truncateToWidth('Franco', 10, measure)).toBe('…')
    expect(truncateToWidth('Franco', 5, measure)).toBe('')
  })
})
