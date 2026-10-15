import type { Balance } from '../../../domain/models/balance'
import type { Participant } from '../../../domain/models/participant'
import type { SplitSummary } from '../../../domain/models/split'
import type { Transfer } from '../../../domain/models/transfer'
import { formatMoney } from '../../../domain/services/money'
import { roundingNote } from '../../../lib/roundingNote'
import { formatImageDate } from './formatImageDate'

/** Mandatory footer on every image and every page (spec share-images). */
export const IMAGE_FOOTER = 'powered by fjbalsamo'

/** Longer lists are split into numbered pages (spec share-images). */
export const ROWS_PER_PAGE = 12

export interface ImageRow {
  left: string
  middle?: string
  right: string
}

/** Everything one PNG shows, as plain data; the renderer only lays it out (design D1). */
export interface ImagePage {
  kind: 'transfers' | 'contributions'
  fileName: string
  heading: string
  date: string
  title: string
  /** "1/2" when a list is split into several pages; absent for a single page. */
  pageLabel?: string
  summaryLines: string[]
  rows: ImageRow[]
  footer: typeof IMAGE_FOOTER
}

export interface ImagePagesInput extends SplitSummary {
  participants: readonly Participant[]
  total: number
  balances: readonly Balance[]
  transfers: readonly Transfer[]
  today: Date
}

const HEADING = 'Cuentas del asado'

interface PageSet {
  kind: ImagePage['kind']
  filePrefix: string
  title: string
  summaryLines: string[]
  rows: ImageRow[]
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks.length > 0 ? chunks : [[]]
}

/** Splits a set into pages of at most ROWS_PER_PAGE rows; every page keeps header and footer. */
function toPages(set: PageSet, date: string): ImagePage[] {
  const chunks = chunk(set.rows, ROWS_PER_PAGE)
  return chunks.map((rows, index) => ({
    kind: set.kind,
    fileName: `${set.filePrefix}-${index + 1}.png`,
    heading: HEADING,
    date,
    title: set.title,
    ...(chunks.length > 1 ? { pageLabel: `${index + 1}/${chunks.length}` } : {}),
    summaryLines: set.summaryLines,
    rows,
    footer: IMAGE_FOOTER,
  }))
}

function transfersSet({ participants, transfers }: ImagePagesInput): PageSet {
  const names = new Map(participants.map((p) => [p.id, p.name]))
  const rows = transfers.map((t) => ({
    left: `${names.get(t.from) ?? ''} → ${names.get(t.to) ?? ''}`,
    right: formatMoney(t.amount),
  }))
  return {
    kind: 'transfers',
    filePrefix: 'asado-transferencias',
    title: 'Quién le transfiere a quién',
    summaryLines: [],
    rows,
  }
}

function describeBalance(amount: number): string {
  if (amount > 0) return `Recibe ${formatMoney(amount)}`
  if (amount < 0) return `Pone ${formatMoney(-amount)}`
  return 'Está al día'
}

function contributionsSet(input: ImagePagesInput): PageSet {
  const { participants, total, share, surplus, surplusRecipientId, balances } = input
  const recipient = participants.find((p) => p.id === surplusRecipientId)?.name
  const note = roundingNote(surplus, recipient)
  const balanceOf = new Map(balances.map((b) => [b.participantId, b.amount]))
  return {
    kind: 'contributions',
    filePrefix: 'asado-aportes',
    title: 'Cuánto puso cada uno',
    summaryLines: [
      `Total ${formatMoney(total)} · Le toca a cada uno ${formatMoney(share)}`,
      ...(note ? [note] : []),
    ],
    rows: participants.map((p) => ({
      left: p.name,
      middle: `Puso ${formatMoney(p.contribution)}`,
      right: describeBalance(balanceOf.get(p.id) ?? 0),
    })),
  }
}

/**
 * Transfers pages first, then contributions pages. No transfers image when nobody owes anything,
 * and nothing at all with no participants.
 */
export function buildImagePages(input: ImagePagesInput): ImagePage[] {
  if (input.participants.length === 0) return []
  const date = formatImageDate(input.today)
  const transfers = input.transfers.length > 0 ? toPages(transfersSet(input), date) : []
  return [...transfers, ...toPages(contributionsSet(input), date)]
}
