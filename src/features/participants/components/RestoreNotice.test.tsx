import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { RestoreNotice } from './RestoreNotice'

const MESSAGE = 'No pudimos recuperar el asado guardado. Empezamos uno nuevo.'

describe('RestoreNotice', () => {
  it('shows the exact message in a polite status region, not an alert', () => {
    renderWithTheme(<RestoreNotice onClose={() => {}} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(MESSAGE)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes with the "Cerrar aviso" button', async () => {
    const onClose = vi.fn()
    renderWithTheme(<RestoreNotice onClose={onClose} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
