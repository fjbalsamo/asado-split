import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Participant } from '../../../domain/models/participant'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { ParticipantEditForm } from './ParticipantEditForm'

const pica: Participant = { id: 'pica', name: 'Pica', contribution: 4200000 }
const franco: Participant = { id: 'franco', name: 'Franco', contribution: 18000000 }

function setup() {
  const onSave = vi.fn()
  const onCancel = vi.fn()
  renderWithTheme(
    <ParticipantEditForm
      participant={pica}
      participants={[franco, pica]}
      onSave={onSave}
      onCancel={onCancel}
    />,
  )
  return {
    onSave,
    onCancel,
    user: userEvent.setup(),
    name: screen.getByLabelText('Nombre'),
    contribution: screen.getByLabelText('Cuánto puso'),
  }
}

describe('ParticipantEditForm', () => {
  it('prefills the name and the contribution as $ 42.000, focusing the name', () => {
    const { name, contribution } = setup()
    expect(name).toHaveValue('Pica')
    expect(contribution).toHaveValue('$\u00A042.000')
    expect(name).toHaveFocus()
  })

  it('saves the parsed values', async () => {
    const { onSave, user, contribution } = setup()
    await user.clear(contribution)
    await user.type(contribution, '45000')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ name: 'Pica', contribution: 4500000 }),
    )
  })

  it('lets them keep their own name', async () => {
    const { onSave, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ name: 'Pica', contribution: 4200000 }),
    )
    expect(screen.queryByText('Ya hay alguien que se llama así.')).not.toBeInTheDocument()
  })

  it('blocks renaming to an existing name', async () => {
    const { onSave, user, name } = setup()
    await user.clear(name)
    await user.type(name, 'franco')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Ya hay alguien que se llama así.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('discards changes on Cancelar', async () => {
    const { onSave, onCancel, user, contribution } = setup()
    await user.clear(contribution)
    await user.type(contribution, '1')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })
})
