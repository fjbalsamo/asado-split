import { formatMoney } from '../domain/services/money'

/**
 * "Redondeado para arriba: sobran $ 8 para Franco." Shared by the pizarra and the share text.
 * Returns null when there is no surplus, so callers omit the line.
 */
export function roundingNote(surplus: number, recipientName: string | undefined): string | null {
  if (surplus <= 0 || !recipientName) return null
  return `Redondeado para arriba: sobran ${formatMoney(surplus)} para ${recipientName}.`
}
