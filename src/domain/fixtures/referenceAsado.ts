import type { Balance } from '../models/balance'
import type { Participant } from '../models/participant'
import type { SplitSummary } from '../models/split'
import type { Transfer } from '../models/transfer'

/**
 * The reference asado from the project brief, in insertion order.
 * Expected values are typed by hand from the specs (expense-split, settlement), not computed.
 */
export const referenceParticipants: Participant[] = [
  { id: 'franco', name: 'Franco', contribution: 18000000 },
  { id: 'pica', name: 'Pica', contribution: 4200000 },
  { id: 'el-aleman', name: 'El Aleman', contribution: 4000000 },
  { id: 'tito', name: 'Tito', contribution: 0 },
  { id: 'leo', name: 'Leo', contribution: 0 },
  { id: 'mole', name: 'Mole', contribution: 0 },
  { id: 'el-negro', name: 'El Negro', contribution: 0 },
  { id: 'el-pelado', name: 'El Pelado', contribution: 0 },
  { id: 'bucky', name: 'Bucky', contribution: 0 },
]

/** $ 262.000 */
export const referenceTotal = 26200000

/** Everyone pays $ 29.112 (262.000 / 9 rounded up); the $ 8 surplus goes to Franco, the top contributor. */
export const referenceSplit: SplitSummary = {
  share: 2911200,
  surplus: 800,
  surplusRecipientId: 'franco',
}

export const referenceBalances: Balance[] = [
  { participantId: 'franco', amount: 15089600 },
  { participantId: 'pica', amount: 1288800 },
  { participantId: 'el-aleman', amount: 1088800 },
  { participantId: 'tito', amount: -2911200 },
  { participantId: 'leo', amount: -2911200 },
  { participantId: 'mole', amount: -2911200 },
  { participantId: 'el-negro', amount: -2911200 },
  { participantId: 'el-pelado', amount: -2911200 },
  { participantId: 'bucky', amount: -2911200 },
]

export const referenceTransfers: Transfer[] = [
  { from: 'tito', to: 'franco', amount: 2911200 },
  { from: 'leo', to: 'franco', amount: 2911200 },
  { from: 'mole', to: 'franco', amount: 2911200 },
  { from: 'el-negro', to: 'franco', amount: 2911200 },
  { from: 'el-pelado', to: 'franco', amount: 2911200 },
  { from: 'bucky', to: 'franco', amount: 533600 },
  { from: 'bucky', to: 'pica', amount: 1288800 },
  { from: 'bucky', to: 'el-aleman', amount: 1088800 },
]
