import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceTransfers,
} from '../../../domain/fixtures/referenceAsado'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { BalanceList } from './BalanceList'
import { TransferList } from './TransferList'

// Testing Library normalizes the formatter's NBSP to a plain space when matching text.
const text = (element: HTMLElement) => (element.textContent ?? '').replace(/\s+/g, ' ').trim()

describe('TransferList', () => {
  it('lists the reference transfers in settlement order as sentences', () => {
    renderWithTheme(
      <TransferList transfers={referenceTransfers} participants={referenceParticipants} />,
    )
    const items = screen.getAllByRole('listitem').map(text)
    expect(items).toEqual([
      'Tito le transfiere $ 29.112 a Franco',
      'Leo le transfiere $ 29.112 a Franco',
      'Mole le transfiere $ 29.112 a Franco',
      'El Negro le transfiere $ 29.112 a Franco',
      'El Pelado le transfiere $ 29.112 a Franco',
      'Bucky le transfiere $ 5.336 a Franco',
      'Bucky le transfiere $ 12.888 a Pica',
      'Bucky le transfiere $ 10.888 a El Aleman',
    ])
  })

  it('says nobody owes anything when there are no transfers', () => {
    renderWithTheme(<TransferList transfers={[]} participants={referenceParticipants} />)
    expect(screen.getByText('Nadie le debe nada a nadie.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('BalanceList', () => {
  it('shows each balance in insertion order with words, not just color', () => {
    renderWithTheme(
      <BalanceList balances={referenceBalances} participants={referenceParticipants} />,
    )
    const items = screen.getAllByRole('listitem').map(text)
    expect(items).toHaveLength(9)
    expect(items[0]).toBe('Franco Recibe $ 150.896')
    expect(items[1]).toBe('Pica Recibe $ 12.888')
    expect(items[2]).toBe('El Aleman Recibe $ 10.888')
    expect(items[8]).toBe('Bucky Pone $ 29.112')
  })

  it('says "Está al día" for a zero balance', () => {
    renderWithTheme(
      <BalanceList
        balances={[{ participantId: 'franco', amount: 0 }]}
        participants={[{ id: 'franco', name: 'Franco', contribution: 500000 }]}
      />,
    )
    expect(text(screen.getByRole('listitem'))).toBe('Franco Está al día')
  })

  it('has a heading for the balances', () => {
    renderWithTheme(
      <BalanceList balances={referenceBalances} participants={referenceParticipants} />,
    )
    expect(screen.getByRole('heading', { name: 'Cómo quedó cada uno' })).toBeInTheDocument()
  })
})
