// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../../../domain/fixtures/referenceAsado'
import type { Participant } from '../../../domain/models/participant'
import { computeBalances } from '../../../domain/services/balances'
import { settle } from '../../../domain/services/settlement'
import { computeSplit, computeTotal } from '../../../domain/services/split'
import { buildImagePages, type ImagePage, type ImagePagesInput } from './buildImagePages'

const NBSP = String.fromCharCode(0xa0)
/** Spec texts write "$ " for the non-breaking space es-AR formatting emits. */
const spec = (text: string) => text.replaceAll('$ ', `$${NBSP}`)
const TODAY = new Date(2026, 9, 15)

function inputFor(participants: Participant[]): ImagePagesInput {
  const balances = computeBalances(participants)
  return {
    participants,
    total: computeTotal(participants),
    ...computeSplit(participants),
    balances,
    transfers: settle(balances),
    today: TODAY,
  }
}

const referenceInput: ImagePagesInput = {
  participants: referenceParticipants,
  total: referenceTotal,
  ...referenceSplit,
  balances: referenceBalances,
  transfers: referenceTransfers,
  today: TODAY,
}

function people(...contributions: number[]): Participant[] {
  return contributions.map((contribution, i) => ({
    id: `p${i}`,
    name: String.fromCharCode(65 + i),
    contribution,
  }))
}

const transfersPages = (pages: ImagePage[]) => pages.filter((p) => p.kind === 'transfers')
const contributionPages = (pages: ImagePage[]) => pages.filter((p) => p.kind === 'contributions')
const rowText = (row: ImagePage['rows'][number]) =>
  [row.left, row.middle, row.right].filter(Boolean).join(row.middle ? ' · ' : ' ')

describe('buildImagePages: transfers', () => {
  it('builds the reference asado transfers image', () => {
    const [page] = transfersPages(buildImagePages(referenceInput))
    expect(page?.heading).toBe('Cuentas del asado')
    expect(page?.date).toBe('15 de octubre de 2026')
    expect(page?.title).toBe('Quién le transfiere a quién')
    expect(page?.fileName).toBe('asado-transferencias-1.png')
    expect(page?.pageLabel).toBeUndefined()
    expect(page?.footer).toBe('powered by fjbalsamo')
    expect(page?.rows.map(rowText)).toEqual(
      [
        'Tito → Franco $ 29.112',
        'Leo → Franco $ 29.112',
        'Mole → Franco $ 29.112',
        'El Negro → Franco $ 29.112',
        'El Pelado → Franco $ 29.112',
        'Bucky → Franco $ 5.336',
        'Bucky → Pica $ 12.888',
        'Bucky → El Aleman $ 10.888',
      ].map(spec),
    )
  })

  it.each([
    ['one participant', people(500000)],
    ['equal contributions', people(1000000, 1000000)],
    ['a zero total', people(0, 0, 0)],
  ])('builds no transfers image for %s, only the contributions image', (_, list) => {
    const pages = buildImagePages(inputFor(list))
    expect(transfersPages(pages)).toEqual([])
    expect(pages.map((p) => p.fileName)).toEqual(['asado-aportes-1.png'])
  })

  it('builds nothing with no participants', () => {
    expect(buildImagePages(inputFor([]))).toEqual([])
  })
})

describe('buildImagePages: contributions', () => {
  it('builds the reference asado contributions image', () => {
    const [page] = contributionPages(buildImagePages(referenceInput))
    expect(page?.heading).toBe('Cuentas del asado')
    expect(page?.date).toBe('15 de octubre de 2026')
    expect(page?.title).toBe('Cuánto puso cada uno')
    expect(page?.fileName).toBe('asado-aportes-1.png')
    expect(page?.summaryLines).toEqual([
      spec('Total $ 262.000 · Le toca a cada uno $ 29.112'),
      spec('Redondeado para arriba: sobran $ 8 para Franco.'),
    ])
    const rows = page?.rows.map(rowText) ?? []
    expect(rows).toHaveLength(9)
    expect(rows.slice(0, 3)).toEqual(
      [
        'Franco · Puso $ 180.000 · Recibe $ 150.896',
        'Pica · Puso $ 42.000 · Recibe $ 12.888',
        'El Aleman · Puso $ 40.000 · Recibe $ 10.888',
      ].map(spec),
    )
    expect(rows[8]).toBe(spec('Bucky · Puso $ 0 · Pone $ 29.112'))
    expect(page?.footer).toBe('powered by fjbalsamo')
  })

  it('shows the rounding line for a non-divisible total', () => {
    const [page] = contributionPages(buildImagePages(inputFor(people(1000, 0, 0))))
    expect(page?.summaryLines).toEqual([
      spec('Total $ 10 · Le toca a cada uno $ 4'),
      spec('Redondeado para arriba: sobran $ 2 para A.'),
    ])
    expect(page?.rows.map(rowText)).toEqual(
      ['A · Puso $ 10 · Recibe $ 8', 'B · Puso $ 0 · Pone $ 4', 'C · Puso $ 0 · Pone $ 4'].map(
        spec,
      ),
    )
  })

  it('has no rounding line without surplus', () => {
    const [page] = contributionPages(buildImagePages(inputFor(people(1000000, 1000000))))
    expect(page?.summaryLines).toEqual([spec('Total $ 20.000 · Le toca a cada uno $ 10.000')])
    expect(page?.rows.every((r) => r.right === 'Está al día')).toBe(true)
  })

  it('shows "Está al día" for everyone with a zero total', () => {
    const [page] = contributionPages(buildImagePages(inputFor(people(0, 0, 0))))
    expect(page?.summaryLines).toEqual([spec('Total $ 0 · Le toca a cada uno $ 0')])
    expect(page?.rows.map((r) => r.right)).toEqual(['Está al día', 'Está al día', 'Está al día'])
  })

  it('puts transfers before contributions', () => {
    expect(buildImagePages(referenceInput).map((p) => p.fileName)).toEqual([
      'asado-transferencias-1.png',
      'asado-aportes-1.png',
    ])
  })
})

/** n participants: the first one paid $ 1 per person, everyone else 0, so n − 1 transfers. */
function crowd(n: number): Participant[] {
  return people(n * 100, ...Array.from({ length: n - 1 }, () => 0))
}

describe('buildImagePages: pagination', () => {
  it('keeps exactly 12 rows on a single page without a label', () => {
    const [page] = contributionPages(buildImagePages(inputFor(crowd(12))))
    expect(contributionPages(buildImagePages(inputFor(crowd(12))))).toHaveLength(1)
    expect(page?.rows).toHaveLength(12)
    expect(page?.pageLabel).toBeUndefined()
  })

  it('splits 13 rows into 12 + 1 with labels 1/2 and 2/2', () => {
    const pages = contributionPages(buildImagePages(inputFor(crowd(13))))
    expect(pages.map((p) => p.rows.length)).toEqual([12, 1])
    expect(pages.map((p) => p.pageLabel)).toEqual(['1/2', '2/2'])
    expect(pages.map((p) => p.fileName)).toEqual(['asado-aportes-1.png', 'asado-aportes-2.png'])
  })

  it('paginates 15 participants and keeps the share order', () => {
    const pages = buildImagePages(inputFor(crowd(15)))
    expect(pages.map((p) => [p.fileName, p.rows.length, p.pageLabel])).toEqual([
      ['asado-transferencias-1.png', 12, '1/2'],
      ['asado-transferencias-2.png', 2, '2/2'],
      ['asado-aportes-1.png', 12, '1/2'],
      ['asado-aportes-2.png', 3, '2/2'],
    ])
  })

  it('never drops a row and keeps the full header on every page', () => {
    const input = inputFor(crowd(15))
    const pages = buildImagePages(input)
    const contributions = contributionPages(pages)
    expect(contributions.flatMap((p) => p.rows.map((r) => r.left))).toEqual(
      input.participants.map((p) => p.name),
    )
    expect(transfersPages(pages).flatMap((p) => p.rows)).toHaveLength(input.transfers.length)
    for (const page of contributions) {
      expect(page.heading).toBe('Cuentas del asado')
      expect(page.date).toBe('15 de octubre de 2026')
      expect(page.title).toBe('Cuánto puso cada uno')
      expect(page.summaryLines).toEqual(contributions[0]?.summaryLines)
    }
  })
})

describe('buildImagePages: mandatory footer', () => {
  it.each([
    ['the reference asado', referenceInput],
    ['15 participants (paginated)', inputFor(crowd(15))],
  ])('puts "powered by fjbalsamo" on every page for %s', (_, input) => {
    const pages = buildImagePages(input)
    expect(pages.length).toBeGreaterThan(0)
    for (const page of pages) {
      expect(page.footer).toBe('powered by fjbalsamo')
    }
    expect(JSON.stringify(pages)).not.toContain('AsadoSplit')
  })

  it('covers every page of a paginated set', () => {
    const pages = buildImagePages(inputFor(crowd(15)))
    expect(pages.filter((p) => p.footer === 'powered by fjbalsamo')).toHaveLength(pages.length)
    expect(pages).toHaveLength(4)
  })
})
