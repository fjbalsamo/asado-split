import type { Balance } from '../models/balance'
import type { Participant } from '../models/participant'
import { computeSplit } from './split'

/**
 * contribution − share per participant, in insertion order; the rounding surplus is added to its
 * recipient. Σ balances = Σ contributions − n × share + surplus = 0 (design D4).
 */
export function computeBalances(participants: readonly Participant[]): Balance[] {
  const { share, surplus, surplusRecipientId } = computeSplit(participants)
  return participants.map((p) => ({
    participantId: p.id,
    amount: p.contribution - share + (p.id === surplusRecipientId ? surplus : 0),
  }))
}
