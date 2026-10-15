// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ValidationError } from 'yup'
import { referenceParticipants } from '../../../domain/fixtures/referenceAsado'
import {
  createParticipantSchema,
  participantMessages as m,
  toParticipantDraft,
  type ParticipantFormValues,
} from './participantSchema'

const schema = createParticipantSchema(referenceParticipants)

async function errorAt(
  path: keyof ParticipantFormValues,
  values: ParticipantFormValues,
  s = schema,
): Promise<string | null> {
  try {
    await s.validateAt(path, values)
    return null
  } catch (error) {
    if (error instanceof ValidationError) return error.message
    throw error
  }
}

describe('participant schema: messages are the exact es-AR strings from the specs', () => {
  it('has the spec texts', () => {
    expect(m).toEqual({
      nameRequired: 'Ingresá un nombre.',
      nameTooLong: 'Usá hasta 40 caracteres.',
      nameTaken: 'Ya hay alguien que se llama así.',
      amountFormat: 'Ingresá un monto válido, por ejemplo 15000.',
      amountNegative: 'El monto no puede ser negativo.',
      amountDecimals: 'Poné el monto sin centavos.',
      amountMax: 'El monto no puede superar los $ 100.000.000.',
    })
  })
})

describe('name', () => {
  it.each([
    ['', m.nameRequired],
    ['   ', m.nameRequired],
    ['a'.repeat(41), m.nameTooLong],
    [' pica ', m.nameTaken],
    ['FRANCO', m.nameTaken],
    ['El Aleman', m.nameTaken],
  ])('rejects %j with %j', async (name, message) => {
    expect(await errorAt('name', { name, contribution: '' })).toBe(message)
  })

  it.each(['Nico', '  Nico  ', 'a'.repeat(40), ` ${'a'.repeat(40)} `])(
    'accepts %j',
    async (name) => {
      expect(await errorAt('name', { name, contribution: '' })).toBeNull()
    },
  )

  it('allows keeping your own name while editing', async () => {
    const editing = createParticipantSchema(referenceParticipants, 'pica')
    expect(await errorAt('name', { name: 'Pica', contribution: '' }, editing)).toBeNull()
    expect(await errorAt('name', { name: 'franco', contribution: '' }, editing)).toBe(m.nameTaken)
  })

  it('uses the list it was built with', async () => {
    const empty = createParticipantSchema([])
    expect(await errorAt('name', { name: 'Pica', contribution: '' }, empty)).toBeNull()
  })
})

describe('contribution', () => {
  it.each([
    ['mucho', m.amountFormat],
    ['1.5000', m.amountFormat],
    ['-100', m.amountNegative],
    ['-500', m.amountNegative],
    ['1500,50', m.amountDecimals],
    ['1500.75', m.amountDecimals],
    ['1.500,05', m.amountDecimals],
    ['100.000.001', m.amountMax],
  ])('rejects %j with %j', async (contribution, message) => {
    expect(await errorAt('contribution', { name: 'Nico', contribution })).toBe(message)
  })

  it.each(['', '180000', '1.500', '1500', '1.500,00', '1500.00', '$\u00A01.500', '100.000.000'])(
    'accepts %j',
    async (contribution) => {
      expect(await errorAt('contribution', { name: 'Nico', contribution })).toBeNull()
    },
  )
})

describe('as Formik runs it', () => {
  it('accepts an empty contribution even after Formik turns "" into undefined', async () => {
    const values = { name: 'Tito', contribution: undefined } as unknown as ParticipantFormValues
    expect(await errorAt('contribution', values)).toBeNull()
  })
})

describe('toParticipantDraft', () => {
  it('trims the name and parses the amount to centavos', () => {
    expect(toParticipantDraft({ name: '  Franco ', contribution: '180000' })).toEqual({
      name: 'Franco',
      contribution: 18000000,
    })
  })

  it('treats an empty amount as 0', () => {
    expect(toParticipantDraft({ name: 'Tito', contribution: '' })).toEqual({
      name: 'Tito',
      contribution: 0,
    })
  })

  it('reads the blur-formatted value', () => {
    expect(toParticipantDraft({ name: 'Pica', contribution: '$\u00A045.000' }).contribution).toBe(
      4500000,
    )
  })
})
