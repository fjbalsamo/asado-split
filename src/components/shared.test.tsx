import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithTheme } from '../test/renderWithTheme'
import { AppHeader } from './AppHeader'
import { EmptyState } from './EmptyState'
import { Section } from './Section'

describe('Section', () => {
  it('renders a section labelled by its heading', () => {
    renderWithTheme(
      <Section title="Quiénes vinieron">
        <p>contenido</p>
      </Section>,
    )
    const section = screen.getByRole('region', { name: 'Quiénes vinieron' })
    expect(section.tagName).toBe('SECTION')
    expect(screen.getByRole('heading', { level: 2, name: 'Quiénes vinieron' })).toBeInTheDocument()
    expect(section).toHaveTextContent('contenido')
  })

  it('gives each section a unique heading id', () => {
    renderWithTheme(
      <>
        <Section title="Uno">a</Section>
        <Section title="Dos">b</Section>
      </>,
    )
    const [one, two] = screen.getAllByRole('heading', { level: 2 })
    expect(one?.id).toBeTruthy()
    expect(one?.id).not.toBe(two?.id)
  })
})

describe('AppHeader', () => {
  it('shows the app name as the only h1 and the voseo subtitle', () => {
    renderWithTheme(<AppHeader />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'AsadoSplit' })).toBeInTheDocument()
    expect(
      screen.getByText('Anotá cuánto puso cada uno y te decimos quién le transfiere a quién.'),
    ).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('shows its message', () => {
    renderWithTheme(<EmptyState message="Todavía no hay nadie. Agregá a alguien para arrancar." />)
    expect(
      screen.getByText('Todavía no hay nadie. Agregá a alguien para arrancar.'),
    ).toBeInTheDocument()
  })
})
