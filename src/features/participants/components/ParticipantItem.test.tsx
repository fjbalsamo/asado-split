import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Participant } from '../../../domain/models/participant'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { ParticipantItem } from './ParticipantItem'

const pica: Participant = { id: 'pica', name: 'Pica', contribution: 4200000 }

function setup(focusEditButton = false) {
  const onEdit = vi.fn()
  const onRemove = vi.fn()
  renderWithTheme(
    <ul>
      <ParticipantItem
        participant={pica}
        onEdit={onEdit}
        onRemove={onRemove}
        focusEditButton={focusEditButton}
      />
    </ul>,
  )
  return { onEdit, onRemove, user: userEvent.setup() }
}

describe('ParticipantItem', () => {
  it('shows the name and what they put in', () => {
    setup()
    expect(screen.getByText('Pica')).toBeInTheDocument()
    expect(screen.getByText('Puso $ 42.000')).toBeInTheDocument()
  })

  it('names its icon buttons for assistive tech', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Editar a Pica' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sacar a Pica' })).toBeInTheDocument()
  })

  it('reports edit and remove with the participant id', async () => {
    const { onEdit, onRemove, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Editar a Pica' }))
    await user.click(screen.getByRole('button', { name: 'Sacar a Pica' }))
    expect(onEdit).toHaveBeenCalledWith('pica')
    expect(onRemove).toHaveBeenCalledWith('pica')
  })

  it('can take focus back on its edit button', () => {
    setup(true)
    expect(screen.getByRole('button', { name: 'Editar a Pica' })).toHaveFocus()
  })
})
