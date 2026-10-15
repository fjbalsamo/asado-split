// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomInt, seededRandom } from '../../test/seededRandom'
import { referenceParticipants, referenceSplit, referenceTotal } from '../fixtures/referenceAsado'
import type { Participant } from '../models/participant'
import { computeSplit, computeTotal } from './split'

function people(...contributions: number[]): Participant[] {
  return contributions.map((contribution, i) => ({ id: `p${i}`, name: `P${i}`, contribution }))
}

describe('computeTotal', () => {
  it('is 0 with no participants', () => {
    expect(computeTotal([])).toBe(0)
  })

  it('sums the reference asado', () => {
    expect(computeTotal(referenceParticipants)).toBe(referenceTotal)
  })
})

describe('computeSplit', () => {
  it('matches the reference asado: $ 29.112 each, $ 8 surplus to Franco', () => {
    expect(computeSplit(referenceParticipants)).toEqual(referenceSplit)
  })

  it('rounds a non-divisible total up: $ 10 / 3 → $ 4 each, $ 2 surplus to A', () => {
    expect(computeSplit(people(1000, 0, 0))).toEqual({
      share: 400,
      surplus: 200,
      surplusRecipientId: 'p0',
    })
  })

  it('gives the surplus to the highest contribution, not the first participant', () => {
    const list: Participant[] = [
      { id: 'zoe', name: 'Zoe', contribution: 100 },
      { id: 'ana', name: 'Ana', contribution: 200 },
    ]
    expect(computeSplit(list)).toEqual({ share: 200, surplus: 100, surplusRecipientId: 'ana' })
  })

  it('breaks a tie on the highest contribution by insertion order', () => {
    expect(computeSplit(people(500, 500, 0))).toEqual({
      share: 400,
      surplus: 200,
      surplusRecipientId: 'p0',
    })
  })

  it('has no surplus and no recipient for a divisible total', () => {
    expect(computeSplit(people(4000000, 0, 0, 0))).toEqual({
      share: 1000000,
      surplus: 0,
      surplusRecipientId: null,
    })
  })

  it('is all zero for a zero total', () => {
    expect(computeSplit(people(0, 0, 0))).toEqual({
      share: 0,
      surplus: 0,
      surplusRecipientId: null,
    })
  })

  it('gives a single participant the whole total and no surplus', () => {
    expect(computeSplit(people(500000))).toEqual({
      share: 500000,
      surplus: 0,
      surplusRecipientId: null,
    })
  })

  it('is empty with no participants', () => {
    expect(computeSplit([])).toEqual({ share: 0, surplus: 0, surplusRecipientId: null })
  })

  it('keeps invariants over random whole-peso asados', () => {
    const random = seededRandom(7)
    for (let run = 0; run < 300; run++) {
      const count = randomInt(random, 1, 25)
      const list = people(
        ...Array.from({ length: count }, () =>
          random() < 0.3 ? 0 : randomInt(random, 0, 100_000_000) * 100,
        ),
      )
      const total = computeTotal(list)
      const { share, surplus, surplusRecipientId } = computeSplit(list)

      expect(share % 100).toBe(0)
      expect(share * count - surplus).toBe(total)
      expect(surplus).toBeGreaterThanOrEqual(0)
      expect(surplus).toBeLessThanOrEqual((count - 1) * 100)
      expect(surplus % 100).toBe(0)
      expect(share * count).toBeGreaterThanOrEqual(total)
      expect((share - 100) * count).toBeLessThan(total || 1)

      if (surplus === 0) {
        expect(surplusRecipientId).toBeNull()
      } else {
        const max = Math.max(...list.map((p) => p.contribution))
        const first = list.find((p) => p.contribution === max)
        expect(surplusRecipientId).toBe(first?.id)
      }
    }
  })
})
