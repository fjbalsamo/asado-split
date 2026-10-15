// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { formatImageDate } from './formatImageDate'

describe('formatImageDate', () => {
  it.each([
    [new Date(2026, 9, 15), '15 de octubre de 2026'],
    [new Date(2026, 0, 1), '1 de enero de 2026'],
    [new Date(2027, 11, 31), '31 de diciembre de 2027'],
  ])('formats %s in long es-AR form', (today, expected) => {
    expect(formatImageDate(today)).toBe(expected)
  })
})
