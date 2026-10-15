import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { referenceParticipants } from './domain/fixtures/referenceAsado'
import { renderWithTheme } from './test/renderWithTheme'

const normalized = (element: HTMLElement) => (element.textContent ?? '').replace(/\s+/g, ' ')

function transferLines(): string[] {
  const settlement = screen.getByRole('region', { name: 'Quién le transfiere a quién' })
  return within(settlement)
    .getAllByRole('listitem')
    .map(normalized)
    .filter((line) => line.includes('le transfiere'))
}

const REFERENCE_TRANSFERS = [
  'Tito le transfiere $ 29.112 a Franco',
  'Leo le transfiere $ 29.112 a Franco',
  'Mole le transfiere $ 29.112 a Franco',
  'El Negro le transfiere $ 29.112 a Franco',
  'El Pelado le transfiere $ 29.112 a Franco',
  'Bucky le transfiere $ 5.336 a Franco',
  'Bucky le transfiere $ 12.888 a Pica',
  'Bucky le transfiere $ 10.888 a El Aleman',
]

describe('App integration: the reference asado', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('is entered through the form, settles exactly, and survives reset + "Deshacer"', async () => {
    const user = userEvent.setup()
    renderWithTheme(<App />)

    for (const { name, contribution } of referenceParticipants) {
      await user.type(screen.getByLabelText('Nombre'), name)
      if (contribution > 0) {
        await user.type(screen.getByLabelText('Cuánto puso'), String(contribution / 100))
      }
      await user.click(screen.getByRole('button', { name: 'Agregar' }))
      await screen.findByRole('button', { name: `Sacar a ${name}` })
    }

    const summary = normalized(screen.getByRole('region', { name: 'Las cuentas' }))
    expect(summary).toContain('$ 262.000')
    expect(summary).toContain('9 personas')
    expect(summary).toContain('$ 29.112')
    expect(summary).toContain('Redondeado para arriba: sobran $ 8 para Franco.')
    expect(transferLines()).toEqual(REFERENCE_TRANSFERS)
    expect(screen.getByText('Recibe $ 150.896')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Empezar otro asado' }))
    expect(screen.queryByRole('region', { name: 'Las cuentas' })).not.toBeInTheDocument()
    expect(await screen.findByText('Asado borrado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(transferLines()).toEqual(REFERENCE_TRANSFERS)
    const names = screen
      .getAllByRole('button', { name: /^Sacar a / })
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual(referenceParticipants.map((p) => `Sacar a ${p.name}`))
  })
})
