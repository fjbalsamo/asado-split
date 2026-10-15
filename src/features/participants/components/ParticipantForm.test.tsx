import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Participant } from '../../../domain/models/participant'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { ParticipantForm } from './ParticipantForm'

const pica: Participant = { id: 'pica', name: 'Pica', contribution: 4200000 }

function setup(participants: readonly Participant[] = []) {
  const onAdd = vi.fn()
  const user = userEvent.setup()
  renderWithTheme(<ParticipantForm participants={participants} onAdd={onAdd} />)
  return {
    onAdd,
    user,
    name: screen.getByLabelText('Nombre'),
    contribution: screen.getByLabelText('Cuánto puso'),
    submit: screen.getByRole('button', { name: 'Agregar' }),
  }
}

describe('ParticipantForm', () => {
  it('adds Franco with 180000 as 18000000 centavos, then clears and refocuses the name', async () => {
    const { onAdd, user, name, contribution, submit } = setup()
    await user.type(name, 'Franco')
    await user.type(contribution, '180000')
    await user.click(submit)
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: 'Franco', contribution: 18000000 }),
    )
    await waitFor(() => expect(name).toHaveValue(''))
    expect(contribution).toHaveValue('')
    expect(name).toHaveFocus()
  })

  it('treats an empty contribution as 0', async () => {
    const { onAdd, user, name, submit } = setup([pica])
    await user.type(name, 'Tito')
    await user.click(submit)
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: 'Tito', contribution: 0 }))
  })

  it('submits with Enter from either field', async () => {
    const { onAdd, user, name, contribution } = setup()
    await user.type(name, 'Leo{Enter}')
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: 'Leo', contribution: 0 }))
    await user.type(name, 'Mole')
    await user.type(contribution, '1.500{Enter}')
    await waitFor(() =>
      expect(onAdd).toHaveBeenLastCalledWith({ name: 'Mole', contribution: 150000 }),
    )
  })

  it('trims the name before adding', async () => {
    const { onAdd, user, name, submit } = setup()
    await user.type(name, '  El Aleman  ')
    await user.click(submit)
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: 'El Aleman', contribution: 0 }))
  })

  it('blocks an invalid contribution with its message', async () => {
    const { onAdd, user, name, contribution, submit } = setup()
    await user.type(name, 'Mole')
    await user.type(contribution, '-100')
    await user.click(submit)
    expect(await screen.findByText('El monto no puede ser negativo.')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('blocks centavos with "Poné el monto sin centavos."', async () => {
    const { onAdd, user, name, contribution, submit } = setup()
    await user.type(name, 'Mole')
    await user.type(contribution, '1500,50')
    await user.click(submit)
    expect(await screen.findByText('Poné el monto sin centavos.')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('blocks an empty name with its message', async () => {
    const { onAdd, user, name, submit } = setup()
    await user.type(name, '   ')
    await user.click(submit)
    expect(await screen.findByText('Ingresá un nombre.')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('blocks a duplicate name, ignoring case and spaces', async () => {
    const { onAdd, user, name, submit } = setup([pica])
    await user.type(name, ' PICA ')
    await user.click(submit)
    expect(await screen.findByText('Ya hay alguien que se llama así.')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not show errors while typing before the field is touched', async () => {
    const { user, contribution } = setup()
    await user.type(contribution, 'mucho')
    expect(
      screen.queryByText('Ingresá un monto válido, por ejemplo 15000.'),
    ).not.toBeInTheDocument()
  })
})
