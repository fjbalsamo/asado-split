import type { Participant } from '../../../domain/models/participant'
import type { SplitSummary } from '../../../domain/models/split'
import type { Transfer } from '../../../domain/models/transfer'
import { formatMoney } from '../../../domain/services/money'
import { roundingNote } from '../../../lib/roundingNote'

export interface ShareTextInput extends SplitSummary {
  participants: readonly Participant[]
  total: number
  transfers: readonly Transfer[]
}

/** Plain, WhatsApp-friendly summary of the asado: one item per line, no markup. */
export function buildShareText({
  participants,
  total,
  share,
  surplus,
  surplusRecipientId,
  transfers,
}: ShareTextInput): string {
  const names = new Map(participants.map((p) => [p.id, p.name]))
  const people = participants.length === 1 ? '1 persona' : `${participants.length} personas`

  const lines = [
    'Cuentas del asado',
    `Total: ${formatMoney(total)} entre ${people}`,
    `Le toca a cada uno: ${formatMoney(share)}`,
  ]
  const note = roundingNote(surplus, surplusRecipientId ? names.get(surplusRecipientId) : undefined)
  if (note) lines.push(note)

  if (transfers.length === 0) {
    lines.push('Nadie le debe nada a nadie.')
  } else {
    lines.push('Transferencias:')
    for (const t of transfers) {
      lines.push(
        `• ${names.get(t.from) ?? ''} → ${names.get(t.to) ?? ''}: ${formatMoney(t.amount)}`,
      )
    }
  }
  return lines.join('\n')
}
