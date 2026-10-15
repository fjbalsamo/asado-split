// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomInt, seededRandom } from '../../test/seededRandom'
import { DomainError } from '../errors'
import { referenceBalances, referenceTransfers } from '../fixtures/referenceAsado'
import type { Balance } from '../models/balance'
import type { Participant } from '../models/participant'
import { computeBalances } from './balances'
import { settle } from './settlement'

function balances(...entries: [string, number][]): Balance[] {
  return entries.map(([participantId, amount]) => ({ participantId, amount }))
}

function people(...contributions: number[]): Participant[] {
  return contributions.map((contribution, i) => ({ id: `p${i}`, name: `P${i}`, contribution }))
}

describe('settle', () => {
  it('produces the exact reference asado transfers, in order', () => {
    expect(settle(referenceBalances)).toEqual(referenceTransfers)
  })

  it('settles a non-divisible single payer: B → A 400, C → A 400', () => {
    expect(settle(balances(['A', 800], ['B', -400], ['C', -400]))).toEqual([
      { from: 'B', to: 'A', amount: 400 },
      { from: 'C', to: 'A', amount: 400 },
    ])
  })

  it('settles a surplus tie: C → A 300, C → B 100', () => {
    expect(settle(computeBalances(people(500, 500, 0)))).toEqual([
      { from: 'p2', to: 'p0', amount: 300 },
      { from: 'p2', to: 'p1', amount: 100 },
    ])
  })

  it('skips even participants: A 3000, B 0, C 0, D 1000', () => {
    expect(settle(computeBalances(people(3000, 0, 0, 1000)))).toEqual([
      { from: 'p1', to: 'p0', amount: 1000 },
      { from: 'p2', to: 'p0', amount: 1000 },
    ])
  })

  it('orders payers by amount owed, largest first', () => {
    expect(settle(balances(['a', -1], ['b', -9], ['c', 10]))).toEqual([
      { from: 'b', to: 'c', amount: 9 },
      { from: 'a', to: 'c', amount: 1 },
    ])
  })

  it('orders receivers by amount due, largest first', () => {
    expect(settle(balances(['a', 1], ['b', 9], ['c', -10]))).toEqual([
      { from: 'c', to: 'b', amount: 9 },
      { from: 'c', to: 'a', amount: 1 },
    ])
  })

  it('breaks ties by insertion order', () => {
    expect(settle(balances(['a', 5], ['b', 5], ['c', -5], ['d', -5]))).toEqual([
      { from: 'c', to: 'a', amount: 5 },
      { from: 'd', to: 'b', amount: 5 },
    ])
  })

  it.each([
    ['no participants', []],
    ['one participant', balances(['a', 0])],
    ['equal contributions', balances(['a', 0], ['b', 0], ['c', 0])],
  ])('returns no transfers with %s', (_, input) => {
    expect(settle(input)).toEqual([])
  })

  it('returns no transfers for a zero total', () => {
    expect(settle(computeBalances(people(0, 0, 0)))).toEqual([])
  })

  it('is deterministic', () => {
    expect(settle(referenceBalances)).toEqual(settle(referenceBalances))
  })

  it('throws DomainError when balances do not sum to 0', () => {
    expect(() => settle(balances(['a', 10], ['b', -9]))).toThrow(DomainError)
  })

  it('keeps invariants over random asados', () => {
    const random = seededRandom(23)
    for (let run = 0; run < 300; run++) {
      const count = randomInt(random, 1, 25)
      const list = people(
        ...Array.from({ length: count }, () =>
          random() < 0.4 ? 0 : randomInt(random, 0, 100_000_000) * 100,
        ),
      )
      const input = computeBalances(list)
      const transfers = settle(input)
      const remaining = new Map(input.map((b) => [b.participantId, b.amount]))

      for (const t of transfers) {
        expect(Number.isSafeInteger(t.amount) && t.amount > 0).toBe(true)
        expect(t.amount % 100).toBe(0)
        expect(t.from).not.toBe(t.to)
        remaining.set(t.from, (remaining.get(t.from) ?? 0) + t.amount)
        remaining.set(t.to, (remaining.get(t.to) ?? 0) - t.amount)
      }
      expect([...remaining.values()].every((amount) => amount === 0)).toBe(true)

      const payers = input.filter((b) => b.amount < 0).length
      const receivers = input.filter((b) => b.amount > 0).length
      expect(transfers.length).toBeLessThanOrEqual(Math.max(0, payers + receivers - 1))

      const nonZero = input.filter((b) => b.amount !== 0).length
      if (nonZero === 0) expect(transfers).toEqual([])
      else expect(transfers.length).toBeLessThanOrEqual(nonZero - 1)
    }
  })
})
