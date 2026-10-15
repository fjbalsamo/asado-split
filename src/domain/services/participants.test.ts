// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { referenceParticipants } from '../fixtures/referenceAsado'
import type { Participant } from '../models/participant'
import {
  addParticipant,
  isNameTaken,
  MAX_NAME_LENGTH,
  normalizeName,
  removeParticipant,
  updateParticipant,
} from './participants'

const pica: Participant = { id: 'pica', name: 'Pica', contribution: 4200000 }
const franco: Participant = { id: 'franco', name: 'Franco', contribution: 18000000 }

describe('normalizeName', () => {
  it('trims surrounding spaces', () => {
    expect(normalizeName('  El Aleman  ')).toBe('El Aleman')
  })
})

describe('isNameTaken', () => {
  it('ignores case and surrounding spaces', () => {
    expect(isNameTaken([pica], ' pica ')).toBe(true)
    expect(isNameTaken([pica], 'PICA')).toBe(true)
  })

  it('is false for a new name', () => {
    expect(isNameTaken([pica], 'Franco')).toBe(false)
  })

  it('ignores the participant being edited', () => {
    expect(isNameTaken([pica, franco], 'Pica', 'pica')).toBe(false)
    expect(isNameTaken([pica, franco], 'franco', 'pica')).toBe(true)
  })
})

describe('addParticipant', () => {
  it('appends at the end with a trimmed name and does not mutate the input', () => {
    const list = [franco]
    const result = addParticipant(list, { id: 'aleman', name: '  El Aleman  ', contribution: 0 })
    expect(result.ok && result.participants.map((p) => p.name)).toEqual(['Franco', 'El Aleman'])
    expect(list).toEqual([franco])
  })

  it.each([
    ['empty-name', { id: 'x', name: '   ', contribution: 0 }],
    ['name-too-long', { id: 'x', name: 'a'.repeat(MAX_NAME_LENGTH + 1), contribution: 0 }],
    ['duplicate-name', { id: 'x', name: ' pica ', contribution: 0 }],
    ['duplicate-id', { id: 'pica', name: 'Otro', contribution: 0 }],
    ['empty-id', { id: '', name: 'Otro', contribution: 0 }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: -1 }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: 10.5 }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: Number.MAX_SAFE_INTEGER + 1 }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: Number.NaN }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: 150050 }],
    ['invalid-contribution', { id: 'x', name: 'Otro', contribution: 1 }],
  ])('returns %s without throwing', (error, participant) => {
    expect(() => addParticipant([pica], participant)).not.toThrow()
    expect(addParticipant([pica], participant)).toEqual({ ok: false, error })
  })

  it('accepts a name of exactly the max length', () => {
    const name = 'a'.repeat(MAX_NAME_LENGTH)
    const result = addParticipant([], { id: 'x', name, contribution: 0 })
    expect(result.ok && result.participants[0]?.name).toBe(name)
  })
})

describe('updateParticipant', () => {
  it('changes name and contribution and keeps the position', () => {
    const result = updateParticipant(referenceParticipants, 'pica', {
      name: 'Pica',
      contribution: 4500000,
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.participants[1]).toEqual({ id: 'pica', name: 'Pica', contribution: 4500000 })
    expect(result.participants.map((p) => p.id)).toEqual(referenceParticipants.map((p) => p.id))
  })

  it('trims the new name', () => {
    const result = updateParticipant([pica], 'pica', { name: '  Piqui ', contribution: 0 })
    expect(result.ok && result.participants[0]?.name).toBe('Piqui')
  })

  it('returns duplicate-name when renaming to another participant name', () => {
    expect(updateParticipant([pica, franco], 'pica', { name: 'franco', contribution: 0 })).toEqual({
      ok: false,
      error: 'duplicate-name',
    })
  })

  it('returns invalid-contribution for a negative contribution', () => {
    expect(updateParticipant([pica], 'pica', { name: 'Pica', contribution: -5 })).toEqual({
      ok: false,
      error: 'invalid-contribution',
    })
  })

  it('returns the same list for an unknown id', () => {
    const list = [pica]
    const result = updateParticipant(list, 'nope', { name: 'X', contribution: 0 })
    expect(result.ok && result.participants).toBe(list)
  })
})

describe('removeParticipant', () => {
  it('removes by id and keeps the relative order', () => {
    const next = removeParticipant(referenceParticipants, 'bucky')
    expect(next).toHaveLength(8)
    expect(next.map((p) => p.id)).toEqual(referenceParticipants.slice(0, 8).map((p) => p.id))
  })

  it('returns the same list for an unknown id', () => {
    const list = [pica]
    expect(removeParticipant(list, 'nope')).toBe(list)
  })
})
