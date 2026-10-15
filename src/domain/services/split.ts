import type { Participant } from '../models/participant'
import type { SplitSummary } from '../models/split'
import { CENTAVOS_PER_PESO } from './money'

export function computeTotal(participants: readonly Participant[]): number {
  return participants.reduce((sum, p) => sum + p.contribution, 0)
}

/** Highest contribution; ties go to the participant added first (insertion order). */
function topContributorId(participants: readonly Participant[]): string | null {
  let top: Participant | null = null
  for (const p of participants) {
    if (top === null || p.contribution > top.contribution) top = p
  }
  return top?.id ?? null
}

/**
 * Equal share rounded up to a whole peso: ceil(total / n) pesos, the same for everyone.
 * The surplus (n × share − total, at most n − 1 pesos) goes to the top contributor, so money is
 * conserved exactly. Integer arithmetic only (design D3).
 */
export function computeSplit(participants: readonly Participant[]): SplitSummary {
  const count = participants.length
  if (count === 0) return { share: 0, surplus: 0, surplusRecipientId: null }

  const totalPesos = computeTotal(participants) / CENTAVOS_PER_PESO
  const sharePesos = Math.floor(totalPesos / count) + (totalPesos % count === 0 ? 0 : 1)
  const share = sharePesos * CENTAVOS_PER_PESO
  const surplus = share * count - totalPesos * CENTAVOS_PER_PESO
  return {
    share,
    surplus,
    surplusRecipientId: surplus > 0 ? topContributorId(participants) : null,
  }
}
