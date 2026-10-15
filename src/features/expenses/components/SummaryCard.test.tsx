import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { referenceTotal } from '../../../domain/fixtures/referenceAsado'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { SummaryCard } from './SummaryCard'

// Testing Library normalizes the formatter's NBSP to a plain space when matching text.
function valueOf(label: string): string {
  const term = screen.getByText(label, { selector: 'dt' })
  const definition = term.nextElementSibling
  if (!definition) throw new Error(`No value for ${label}`)
  return (definition.textContent ?? '').replace(/\s+/g, ' ')
}

describe('SummaryCard', () => {
  it('shows the reference asado: total, 9 personas, a single share and the rounding line', () => {
    renderWithTheme(
      <SummaryCard
        total={referenceTotal}
        count={9}
        share={2911200}
        surplus={800}
        surplusRecipientName="Franco"
      />,
    )
    expect(valueOf('Total')).toBe('$ 262.000')
    expect(valueOf('Personas')).toBe('9 personas')
    expect(valueOf('Le toca a cada uno')).toBe('$ 29.112')
    expect(screen.getByText('Redondeado para arriba: sobran $ 8 para Franco.')).toBeInTheDocument()
  })

  it('has no rounding line when the total divides evenly', () => {
    renderWithTheme(<SummaryCard total={2000000} count={2} share={1000000} surplus={0} />)
    expect(valueOf('Total')).toBe('$ 20.000')
    expect(valueOf('Personas')).toBe('2 personas')
    expect(valueOf('Le toca a cada uno')).toBe('$ 10.000')
    expect(screen.queryByText(/Redondeado/)).not.toBeInTheDocument()
  })

  it('uses the singular for one participant', () => {
    renderWithTheme(<SummaryCard total={500000} count={1} share={500000} surplus={0} />)
    expect(valueOf('Personas')).toBe('1 persona')
    expect(valueOf('Le toca a cada uno')).toBe('$ 5.000')
  })

  it('is a description list so label and value are read together', () => {
    renderWithTheme(<SummaryCard total={0} count={3} share={0} surplus={0} />)
    const list = screen.getByText('Total', { selector: 'dt' }).closest('dl')
    expect(list).not.toBeNull()
    expect(within(list as HTMLElement).getAllByRole('term')).toHaveLength(3)
    expect(valueOf('Total')).toBe('$ 0')
  })
})
