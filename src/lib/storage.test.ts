// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { referenceParticipants } from '../domain/fixtures/referenceAsado'
import {
  loadAsado,
  saveParticipants,
  SCHEMA_VERSION,
  STORAGE_KEY,
  type StorageLike,
} from './storage'

function memoryStorage(initial?: string): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

function stored(participants: unknown, version: unknown = SCHEMA_VERSION): string {
  return JSON.stringify({ version, participants })
}

describe('storage', () => {
  it('round-trips participants in order with a schema version', () => {
    const storage = memoryStorage()
    saveParticipants(referenceParticipants, storage)
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? '')).toEqual({
      version: 1,
      participants: referenceParticipants,
    })
    expect(loadAsado(storage)).toEqual({ participants: referenceParticipants, status: 'restored' })
  })

  it('removes the key when saving an empty list', () => {
    const storage = memoryStorage(stored(referenceParticipants))
    saveParticipants([], storage)
    expect(storage.data.has(STORAGE_KEY)).toBe(false)
  })

  it('reports none when nothing is stored', () => {
    expect(loadAsado(memoryStorage())).toEqual({ participants: [], status: 'none' })
  })

  it.each([
    ['corrupted JSON', '{not json'],
    ['null', 'null'],
    ['a number', '42'],
    ['an array', '[]'],
    ['unknown version', stored(referenceParticipants, 99)],
    ['missing version', JSON.stringify({ participants: referenceParticipants })],
    ['non-array participants', stored({ franco: 1 })],
    ['a non-object entry', stored(['Franco'])],
    ['a fractional contribution', stored([{ id: 'a', name: 'A', contribution: 10.5 }])],
    ['a negative contribution', stored([{ id: 'a', name: 'A', contribution: -100 }])],
    ['a contribution with centavos', stored([{ id: 'a', name: 'A', contribution: 150050 }])],
    ['a string contribution', stored([{ id: 'a', name: 'A', contribution: '100' }])],
    ['an unsafe contribution', stored([{ id: 'a', name: 'A', contribution: 2 ** 53 }])],
    ['an empty name', stored([{ id: 'a', name: '  ', contribution: 0 }])],
    ['a missing id', stored([{ name: 'A', contribution: 0 }])],
    ['an empty id', stored([{ id: '', name: 'A', contribution: 0 }])],
    [
      'duplicate ids',
      stored([
        { id: 'a', name: 'A', contribution: 0 },
        { id: 'a', name: 'B', contribution: 0 },
      ]),
    ],
    [
      'duplicate names ignoring case and spaces',
      stored([
        { id: 'a', name: 'Pica', contribution: 0 },
        { id: 'b', name: ' pica ', contribution: 0 },
      ]),
    ],
  ])('discards %s', (_, raw) => {
    expect(loadAsado(memoryStorage(raw))).toEqual({ participants: [], status: 'discarded' })
  })

  it('discards the whole list if any entry is invalid', () => {
    const raw = stored([
      { id: 'a', name: 'Franco', contribution: 100 },
      { id: 'b', name: '', contribution: 0 },
    ])
    expect(loadAsado(memoryStorage(raw))).toEqual({ participants: [], status: 'discarded' })
  })

  it('never throws when storage itself throws', () => {
    expect(loadAsado(throwingStorage)).toEqual({ participants: [], status: 'none' })
    expect(() => saveParticipants(referenceParticipants, throwingStorage)).not.toThrow()
    expect(() => saveParticipants([], throwingStorage)).not.toThrow()
  })

  it('reports none when no storage is available', () => {
    expect(loadAsado(undefined)).toEqual({ participants: [], status: 'none' })
    expect(() => saveParticipants(referenceParticipants, undefined)).not.toThrow()
  })
})
