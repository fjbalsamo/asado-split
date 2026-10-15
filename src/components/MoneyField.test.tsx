import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from 'formik'
import { describe, expect, it } from 'vitest'
import { parseMoney } from '../domain/services/money'
import { renderWithTheme } from '../test/renderWithTheme'
import { MoneyField } from './MoneyField'

const FORMAT_MESSAGE = 'Ingresá un monto válido, por ejemplo 15000.'

function renderField(initial = '') {
  renderWithTheme(
    <Formik
      initialValues={{ contribution: initial }}
      validate={({ contribution }) =>
        parseMoney(contribution).ok ? {} : { contribution: FORMAT_MESSAGE }
      }
      onSubmit={() => {}}
    >
      <form>
        <MoneyField
          name="contribution"
          label="Cuánto puso"
          helperText="En pesos. Dejalo vacío si no puso nada."
        />
        <button type="button">otro</button>
      </form>
    </Formik>,
  )
  return screen.getByLabelText('Cuánto puso')
}

describe('MoneyField', () => {
  it('asks phones for a numeric keypad and has no $ adornment', () => {
    const input = renderField()
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(screen.queryByText('$')).not.toBeInTheDocument()
    expect(screen.getByText('En pesos. Dejalo vacío si no puso nada.')).toBeInTheDocument()
  })

  it.each([
    ['1500', '$\u00A01.500'],
    ['1.500', '$\u00A01.500'],
    ['1.500,00', '$\u00A01.500'],
    ['1500.00', '$\u00A01.500'],
    ['180000', '$\u00A0180.000'],
  ])('reformats %j to %j on blur', async (typed, shown) => {
    const user = userEvent.setup()
    const input = renderField()
    await user.type(input, typed)
    await user.tab()
    expect(input).toHaveValue(shown)
  })

  it('keeps an empty field empty', async () => {
    const user = userEvent.setup()
    const input = renderField()
    await user.click(input)
    await user.tab()
    expect(input).toHaveValue('')
    expect(screen.queryByText(FORMAT_MESSAGE)).not.toBeInTheDocument()
  })

  it('leaves an invalid value as typed and shows the message', async () => {
    const user = userEvent.setup()
    const input = renderField()
    await user.type(input, '1.5000')
    await user.tab()
    expect(input).toHaveValue('1.5000')
    expect(await screen.findByText(FORMAT_MESSAGE)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts its own formatted value when edited again', async () => {
    const user = userEvent.setup()
    const input = renderField('$\u00A042.000')
    await user.click(input)
    await user.tab()
    expect(input).toHaveValue('$\u00A042.000')
    expect(screen.queryByText(FORMAT_MESSAGE)).not.toBeInTheDocument()
  })
})
