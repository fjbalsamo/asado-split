import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { UNDO_WINDOW_MS, UndoResetSnackbar } from './UndoResetSnackbar'

function setup(open = true) {
  const onUndo = vi.fn()
  const onDismiss = vi.fn()
  renderWithTheme(
    <>
      <h1>AsadoSplit</h1>
      <UndoResetSnackbar open={open} onUndo={onUndo} onDismiss={onDismiss} />
    </>,
  )
  return { onUndo, onDismiss }
}

describe('UndoResetSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows "Asado borrado" with a "Deshacer" action and no dialog', () => {
    setup()
    expect(screen.getByText('Asado borrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    setup(false)
    expect(screen.queryByText('Asado borrado')).not.toBeInTheDocument()
  })

  it('calls onUndo from "Deshacer"', () => {
    const { onUndo, onDismiss } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('times out after 6 seconds', () => {
    const { onDismiss } = setup()
    expect(UNDO_WINDOW_MS).toBe(6000)
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 1))
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('is not dismissed by tapping elsewhere', () => {
    const { onDismiss } = setup()
    act(() => vi.advanceTimersByTime(10))
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'AsadoSplit' }))
    fireEvent.click(screen.getByRole('heading', { name: 'AsadoSplit' }))
    fireEvent.touchEnd(screen.getByRole('heading', { name: 'AsadoSplit' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
