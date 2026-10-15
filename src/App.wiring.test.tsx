import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { referenceParticipants } from './domain/fixtures/referenceAsado'
import { STORAGE_KEY } from './lib/storage'
import { renderWithTheme } from './test/renderWithTheme'

const normalized = (element: HTMLElement) => (element.textContent ?? '').replace(/\s+/g, ' ')

async function add(user: ReturnType<typeof userEvent.setup>, name: string, amount = '') {
  await user.type(screen.getByLabelText('Nombre'), name)
  if (amount) await user.type(screen.getByLabelText('Cuánto puso'), amount)
  await user.click(screen.getByRole('button', { name: 'Agregar' }))
  await screen.findByRole('button', { name: `Sacar a ${name}` })
}

describe('App wiring (task 10.1)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('first visit: header, form and empty state only', () => {
    renderWithTheme(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'AsadoSplit' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Quiénes vinieron' })).toBeInTheDocument()
    expect(
      screen.getByText('Todavía no hay nadie. Agregá a alguien para arrancar.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Las cuentas' })).not.toBeInTheDocument()
    for (const name of ['Compartir transferencias', 'Compartir aportes', 'Compartir como texto']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: 'Empezar otro asado' })).not.toBeInTheDocument()
    expect(screen.queryByText(/No pudimos recuperar/)).not.toBeInTheDocument()
  })

  it('one participant: summary for 1 persona and nobody owes anything', async () => {
    const user = userEvent.setup()
    renderWithTheme(<App />)
    await add(user, 'Franco', '5000')
    const summary = screen.getByRole('region', { name: 'Las cuentas' })
    expect(normalized(summary)).toContain('$ 5.000')
    expect(normalized(summary)).toContain('1 persona')
    const settlement = screen.getByRole('region', { name: 'Quién le transfiere a quién' })
    expect(within(settlement).getByText('Nadie le debe nada a nadie.')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Compartir transferencias' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartir aportes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartir como texto' })).toBeInTheDocument()
  })

  it('shows the reference asado settlement from storage, in spec order', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, participants: referenceParticipants }),
    )
    renderWithTheme(<App />)
    const sections = screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'))
    expect(sections).toHaveLength(3)
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['Quiénes vinieron', 'Las cuentas', 'Quién le transfiere a quién'])
    const settlement = screen.getByRole('region', { name: 'Quién le transfiere a quién' })
    expect(normalized(within(settlement).getAllByRole('listitem')[0]!)).toBe(
      'Tito le transfiere $ 29.112 a Franco',
    )
  })

  it('reset empties the asado and "Deshacer" brings it back', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, participants: referenceParticipants }),
    )
    const user = userEvent.setup()
    renderWithTheme(<App />)
    await user.click(screen.getByRole('button', { name: 'Empezar otro asado' }))
    expect(
      screen.getByText('Todavía no hay nadie. Agregá a alguien para arrancar.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Asado borrado')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(screen.getByRole('button', { name: 'Sacar a Bucky' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Asado borrado')).not.toBeInTheDocument())
  })

  it('shows the recovery notice for corrupted storage and hides it on close', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    const user = userEvent.setup()
    renderWithTheme(<App />)
    const notice = screen.getByRole('status', { name: '' })
    expect(notice).toHaveTextContent('No pudimos recuperar el asado guardado. Empezamos uno nuevo.')
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText(/No pudimos recuperar/)).not.toBeInTheDocument()
  })

  describe('sharing', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    function seedReference() {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, participants: referenceParticipants }),
      )
    }

    it('"Compartir como texto" shares the plain-text summary', async () => {
      seedReference()
      const share = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { share })
      const user = userEvent.setup()
      renderWithTheme(<App />)
      await user.click(screen.getByRole('button', { name: 'Compartir como texto' }))
      expect(share).toHaveBeenCalledWith({ text: expect.stringContaining('Cuentas del asado') })
      expect(await screen.findByText('Listo, compartido.')).toBeInTheDocument()
    })

    function stubCanvas() {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        scale: () => {},
        fillRect: () => {},
        fillText: () => {},
        measureText: (text: string) => ({ width: text.length * 7 }),
      } as unknown as CanvasRenderingContext2D)
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
        callback: BlobCallback,
      ) {
        callback(new Blob(['png'], { type: 'image/png' }))
      })
    }

    it('places each share action right after the list it shares', () => {
      seedReference()
      renderWithTheme(<App />)
      const settlement = screen.getByRole('region', { name: 'Quién le transfiere a quién' })
      const order = [
        within(settlement).getByText('Tito', { exact: false, selector: 'strong' }),
        within(settlement).getByRole('button', { name: 'Compartir transferencias' }),
        within(settlement).getByRole('heading', { name: 'Cómo quedó cada uno' }),
        within(settlement).getByRole('button', { name: 'Compartir aportes' }),
        within(settlement).getByRole('button', { name: 'Compartir como texto' }),
      ]
      for (let i = 1; i < order.length; i++) {
        const previous = order[i - 1] as Node
        expect(
          previous.compareDocumentPosition(order[i] as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      }
    })

    it.each([
      ['Compartir transferencias', ['asado-transferencias-1.png']],
      ['Compartir aportes', ['asado-aportes-1.png']],
    ])('%s shares only its own image', async (label, expected) => {
      seedReference()
      stubCanvas()
      const share = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { share, canShare: () => true })
      const user = userEvent.setup()
      renderWithTheme(<App />)
      await user.click(screen.getByRole('button', { name: label }))
      expect(await screen.findByText('Listo, compartido.')).toBeInTheDocument()
      const data = share.mock.calls[0]?.[0] as ShareData
      expect(data.files?.map((f) => f.name)).toEqual(expected)
    })

    it('keeps each button status independent', async () => {
      seedReference()
      stubCanvas()
      const share = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('NotAllowedError'))
      vi.stubGlobal('navigator', { share, canShare: () => true })
      const user = userEvent.setup()
      renderWithTheme(<App />)
      await user.click(screen.getByRole('button', { name: 'Compartir transferencias' }))
      expect(await screen.findByText('Listo, compartido.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Compartir aportes' }))
      expect(await screen.findByText('No se pudo compartir. Probá de nuevo.')).toBeInTheDocument()
      expect(screen.getByText('Listo, compartido.')).toBeInTheDocument()
    })
  })
})
