// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomInt, seededRandom } from '../../test/seededRandom'
import { referenceBalances, referenceParticipants } from '../fixtures/referenceAsado'
import type { Participant } from '../models/participant'
import { computeBalances } from './balances'

function people(...contributions: number[]): Participant[] {
  return contributions.map((contribution, i) => ({ id: `p${i}`, name: `P${i}`, contribution }))
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

describe('computeBalances', () => {
  it('matches the reference asado', () => {
    expect(computeBalances(referenceParticipants)).toEqual(referenceBalances)
  })

  it('is all zero with equal contributions', () => {
    expect(computeBalances(people(1000000, 1000000, 1000000)).map((b) => b.amount)).toEqual([
      0, 0, 0,
    ])
  })

  it('is zero for a single participant', () => {
    expect(computeBalances(people(500000))).toEqual([{ participantId: 'p0', amount: 0 }])
  })

  it('rounds up and gives the surplus to the top contributor: $ 10 / 3', () => {
    expect(computeBalances(people(1000, 0, 0)).map((b) => b.amount)).toEqual([800, -400, -400])
  })

  it('keeps the surplus with the first of tied top contributors', () => {
    expect(computeBalances(people(500, 500, 0)).map((b) => b.amount)).toEqual([300, 100, -400])
  })

  it('is empty with no participants', () => {
    expect(computeBalances([])).toEqual([])
  })

  it('always sums to exactly 0', () => {
    const random = seededRandom(11)
    for (let run = 0; run < 300; run++) {
      const count = randomInt(random, 1, 25)
      const list = people(
        ...Array.from({ length: count }, () => randomInt(random, 0, 100_000_000) * 100),
      )
      expect(sum(computeBalances(list).map((b) => b.amount))).toBe(0)
    }
  })
})
