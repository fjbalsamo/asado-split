// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../../../domain/fixtures/referenceAsado'
import type { Participant } from '../../../domain/models/participant'
import { buildShareText } from './buildShareText'

/** Spec texts write "$ " for the non-breaking space es-AR formatting emits. */
function specText(lines: string[]): string {
  return lines.join('\n').replaceAll('$ ', '$\u00A0')
}

const reference = {
  participants: referenceParticipants,
  total: referenceTotal,
  ...referenceSplit,
  transfers: referenceTransfers,
}

describe('buildShareText', () => {
  it('matches the reference asado text exactly, with the rounding line', () => {
    expect(buildShareText(reference)).toBe(
      specText([
        'Cuentas del asado',
        'Total: $ 262.000 entre 9 personas',
        'Le toca a cada uno: $ 29.112',
        'Redondeado para arriba: sobran $ 8 para Franco.',
        'Transferencias:',
        '• Tito → Franco: $ 29.112',
        '• Leo → Franco: $ 29.112',
        '• Mole → Franco: $ 29.112',
        '• El Negro → Franco: $ 29.112',
        '• El Pelado → Franco: $ 29.112',
        '• Bucky → Franco: $ 5.336',
        '• Bucky → Pica: $ 12.888',
        '• Bucky → El Aleman: $ 10.888',
      ]),
    )
  })

  it('matches the equal-contributions text exactly, without a rounding line', () => {
    const participants: Participant[] = [
      { id: 'a', name: 'A', contribution: 1000000 },
      { id: 'b', name: 'B', contribution: 1000000 },
    ]
    const text = buildShareText({
      participants,
      total: 2000000,
      share: 1000000,
      surplus: 0,
      surplusRecipientId: null,
      transfers: [],
    })
    expect(text).toBe(
      specText([
        'Cuentas del asado',
        'Total: $ 20.000 entre 2 personas',
        'Le toca a cada uno: $ 10.000',
        'Nadie le debe nada a nadie.',
      ]),
    )
  })

  it('uses the singular for one participant', () => {
    const text = buildShareText({
      participants: [{ id: 'franco', name: 'Franco', contribution: 500000 }],
      total: 500000,
      share: 500000,
      surplus: 0,
      surplusRecipientId: null,
      transfers: [],
    })
    expect(text.split('\n')[1]).toBe(specText(['Total: $ 5.000 entre 1 persona']))
  })

  it('is plain text with one item per line and no markup', () => {
    const text = buildShareText(reference)
    expect(text).not.toMatch(/[*_~`<>]/)
    expect(text.split('\n')).toHaveLength(13)
  })
})
