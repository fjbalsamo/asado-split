import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ShareImagesStatus } from '../../../hooks/useShareImages'
import type { ShareStatus } from '../../../hooks/useShareSummary'
import { renderWithTheme } from '../../../test/renderWithTheme'
import { ResetButton } from './ResetButton'
import { ShareImageButton } from './ShareImageButton'
import { ShareTextButton } from './ShareTextButton'

describe('ShareImageButton', () => {
  it.each(['Compartir transferencias', 'Compartir aportes'])(
    'renders %j as an outlined button that calls onShare',
    async (label) => {
      const onShare = vi.fn()
      renderWithTheme(<ShareImageButton label={label} status="idle" onShare={onShare} />)
      const button = screen.getByRole('button', { name: label })
      expect(button.className).toContain('MuiButton-outlined')
      await userEvent.setup().click(button)
      expect(onShare).toHaveBeenCalledOnce()
    },
  )

  it.each<[ShareImagesStatus, string]>([
    ['shared', 'Listo, compartido.'],
    ['downloaded', 'Listo, descargado.'],
    ['error', 'No se pudo compartir. Probá de nuevo.'],
  ])('announces %s as %j in its own polite region', (status, message) => {
    renderWithTheme(
      <ShareImageButton label="Compartir aportes" status={status} onShare={() => {}} />,
    )
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent(message)
  })

  it('keeps its region mounted but empty when idle', () => {
    renderWithTheme(<ShareImageButton label="Compartir aportes" status="idle" onShare={() => {}} />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('keeps two buttons statuses independent', () => {
    renderWithTheme(
      <>
        <ShareImageButton label="Compartir transferencias" status="shared" onShare={() => {}} />
        <ShareImageButton label="Compartir aportes" status="error" onShare={() => {}} />
      </>,
    )
    const [first, second] = screen.getAllByRole('status')
    expect(first).toHaveTextContent('Listo, compartido.')
    expect(second).toHaveTextContent('No se pudo compartir. Probá de nuevo.')
  })
})

describe('ShareTextButton', () => {
  it('is a quiet "Compartir como texto" action', async () => {
    const onShare = vi.fn()
    renderWithTheme(<ShareTextButton status="idle" onShare={onShare} />)
    const button = screen.getByRole('button', { name: 'Compartir como texto' })
    expect(button.className).toContain('MuiButton-text')
    await userEvent.setup().click(button)
    expect(onShare).toHaveBeenCalledOnce()
  })

  it.each<[ShareStatus, string]>([
    ['shared', 'Listo, compartido.'],
    ['copied', 'Copiado. Pegalo en el grupo.'],
    ['error', 'No se pudo compartir. Probá de nuevo.'],
  ])('announces %s as %j in its own polite region', (status, message) => {
    renderWithTheme(<ShareTextButton status={status} onShare={() => {}} />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent(message)
  })
})

describe('ResetButton', () => {
  it('resets with a single tap, no confirmation step', async () => {
    const onReset = vi.fn()
    renderWithTheme(<ResetButton onReset={onReset} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Empezar otro asado' }))
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
