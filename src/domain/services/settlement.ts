import { DomainError } from '../errors'
import type { Balance } from '../models/balance'
import type { Transfer } from '../models/transfer'

interface Position {
  id: string
  index: number
  remaining: number
}

/** Largest remaining amount first; ties by insertion order. Makes the output fully deterministic. */
function byRemainingThenIndex(a: Position, b: Position): number {
  return b.remaining - a.remaining || a.index - b.index
}

/**
 * Greedy settlement: payers and receivers are each sorted once (largest first, ties by insertion
 * order), then paired with two pointers for the smaller remaining amount. O(n log n), and at most
 * payers + receivers − 1 transfers. Reduces transfers but does not guarantee the minimum.
 */
export function settle(balances: readonly Balance[]): Transfer[] {
  const total = balances.reduce((sum, b) => sum + b.amount, 0)
  if (total !== 0) throw new DomainError(`Balances must sum to 0, got ${total}`)

  const payers: Position[] = []
  const receivers: Position[] = []
  balances.forEach((b, index) => {
    if (b.amount < 0) payers.push({ id: b.participantId, index, remaining: -b.amount })
    if (b.amount > 0) receivers.push({ id: b.participantId, index, remaining: b.amount })
  })
  payers.sort(byRemainingThenIndex)
  receivers.sort(byRemainingThenIndex)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < payers.length && j < receivers.length) {
    const payer = payers[i]!
    const receiver = receivers[j]!
    const amount = Math.min(payer.remaining, receiver.remaining)
    transfers.push({ from: payer.id, to: receiver.id, amount })
    payer.remaining -= amount
    receiver.remaining -= amount
    if (payer.remaining === 0) i++
    if (receiver.remaining === 0) j++
  }
  return transfers
}
