import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { referenceParticipants } from '../../../domain/fixtures/referenceAsado'
import type { Participant } from '../../../domain/models/participant'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { ParticipantList } from './ParticipantList'

function setup(participants: readonly Participant[] = referenceParticipants) {
  const onUpdate = vi.fn()
  const onRemove = vi.fn()
  renderWithTheme(
    <ParticipantList participants={participants} onUpdate={onUpdate} onRemove={onRemove} />,
  )
  return { onUpdate, onRemove, user: userEvent.setup() }
}

describe('ParticipantList', () => {
  it('shows the empty state when there is nobody', () => {
    setup([])
    expect(
      screen.getByText('Todavía no hay nadie. Agregá a alguien para arrancar.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists everyone in insertion order', () => {
    setup()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(9)
    expect(items[0]).toHaveTextContent('Franco')
    expect(items[8]).toHaveTextContent('Bucky')
  })

  it('keeps only one row in edit mode at a time', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Editar a Pica' }))
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(1)
    expect(screen.getByLabelText('Nombre')).toHaveValue('Pica')

    await user.click(screen.getByRole('button', { name: 'Editar a Tito' }))
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(1)
    expect(screen.getByLabelText('Nombre')).toHaveValue('Tito')
    expect(screen.getByRole('button', { name: 'Editar a Pica' })).toBeInTheDocument()
  })

  it('saves through onUpdate with the id and leaves edit mode', async () => {
    const { onUpdate, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Editar a Pica' }))
    const contribution = screen.getByLabelText('Cuánto puso')
    await user.clear(contribution)
    await user.type(contribution, '45000')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith('pica', { name: 'Pica', contribution: 4500000 }),
    )
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })

  it('returns focus to the edit button after Cancelar', async () => {
    const { onUpdate, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Editar a Pica' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar a Pica' })).toHaveFocus()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('removes through onRemove with the id', async () => {
    const { onRemove, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sacar a Bucky' }))
    expect(onRemove).toHaveBeenCalledWith('bucky')
  })
})
