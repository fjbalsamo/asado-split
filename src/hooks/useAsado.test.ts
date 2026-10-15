import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  referenceBalances,
  referenceParticipants,
  referenceSplit,
  referenceTotal,
  referenceTransfers,
} from '../domain/fixtures/referenceAsado'
import type { Participant } from '../domain/models/participant'
import { loadAsado, saveParticipants, STORAGE_KEY, type StorageLike } from '../lib/storage'
import { useAsado } from './useAsado'

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

/** Hands out the fixture ids in order so derived values can be compared to the fixture. */
function fixtureIds(participants: Participant[] = referenceParticipants): () => string {
  let next = 0
  return () => participants[next++]?.id ?? `extra-${next}`
}

function setup(initial: Participant[] | string = []) {
  const storage = memoryStorage()
  if (typeof initial === 'string') storage.setItem(STORAGE_KEY, initial)
  else saveParticipants(initial, storage)
  const hook = renderHook(() => useAsado({ storage, createId: fixtureIds() }))
  return { storage, ...hook }
}

function addReference(result: ReturnType<typeof setup>['result']) {
  act(() => {
    for (const { name, contribution } of referenceParticipants) {
      result.current.addParticipant({ name, contribution })
    }
  })
}

describe('useAsado', () => {
  it('starts empty with zeroed derived values', () => {
    const { result } = setup()
    expect(result.current.participants).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.share).toBe(0)
    expect(result.current.surplus).toBe(0)
    expect(result.current.surplusRecipientId).toBeNull()
    expect(result.current.balances).toEqual([])
    expect(result.current.transfers).toEqual([])
    expect(result.current.canUndoReset).toBe(false)
    expect(result.current.restoreFailed).toBe(false)
  })

  it('exposes readonly arrays (compile-time check)', () => {
    const { result } = setup(referenceParticipants)
    const { participants, balances, transfers } = result.current
    // @ts-expect-error participants is readonly
    expect(() => participants.push).toBeDefined()
    // @ts-expect-error balances is readonly
    expect(() => balances.push).toBeDefined()
    // @ts-expect-error transfers is readonly
    expect(() => transfers.push).toBeDefined()
  })

  it('lazily initialises from storage', () => {
    const { result } = setup(referenceParticipants)
    expect(result.current.participants).toEqual(referenceParticipants)
  })

  it('derives the reference asado after adding its participants', () => {
    const { result } = setup()
    addReference(result)
    expect(result.current.participants).toEqual(referenceParticipants)
    expect(result.current.total).toBe(referenceTotal)
    expect(result.current.share).toBe(referenceSplit.share)
    expect(result.current.surplus).toBe(referenceSplit.surplus)
    expect(result.current.surplusRecipientId).toBe('franco')
    expect(result.current.balances).toEqual(referenceBalances)
    expect(result.current.transfers).toEqual(referenceTransfers)
  })

  it('updates in place and recalculates', () => {
    const { result } = setup(referenceParticipants)
    act(() => result.current.updateParticipant('pica', { name: 'Pica', contribution: 4500000 }))
    expect(result.current.participants[1]).toEqual({
      id: 'pica',
      name: 'Pica',
      contribution: 4500000,
    })
    expect(result.current.total).toBe(referenceTotal + 300000)
  })

  it('removes and recalculates: without Bucky each share is $ 32.750', () => {
    const { result } = setup(referenceParticipants)
    act(() => result.current.removeParticipant('bucky'))
    expect(result.current.participants).toHaveLength(8)
    expect(result.current.share).toBe(3275000)
    expect(result.current.surplus).toBe(0)
  })

  it('ignores remove and update for unknown ids', () => {
    const { result } = setup(referenceParticipants)
    act(() => {
      result.current.removeParticipant('ghost')
      result.current.updateParticipant('ghost', { name: 'Mole', contribution: 100000 })
    })
    expect(result.current.participants).toEqual(referenceParticipants)
  })

  describe('invalid changes that bypass the form', () => {
    it('ignores a contribution with centavos without throwing', () => {
      const { result } = setup([referenceParticipants[0]!])
      expect(() =>
        act(() => result.current.addParticipant({ name: 'Mole', contribution: 150050 })),
      ).not.toThrow()
      expect(result.current.participants.map((p) => p.name)).toEqual(['Franco'])
    })

    it('ignores a duplicate name without throwing', () => {
      const { result } = setup(referenceParticipants)
      expect(() =>
        act(() => result.current.addParticipant({ name: ' pica ', contribution: 0 })),
      ).not.toThrow()
      expect(result.current.participants).toEqual(referenceParticipants)
    })

    it('ignores a rename to an existing name without throwing', () => {
      const { result } = setup(referenceParticipants)
      expect(() =>
        act(() => result.current.updateParticipant('pica', { name: 'franco', contribution: 0 })),
      ).not.toThrow()
      expect(result.current.participants).toEqual(referenceParticipants)
    })

    it('ignores a negative contribution without throwing', () => {
      const { result } = setup([referenceParticipants[0]!])
      expect(() =>
        act(() => result.current.addParticipant({ name: 'Mole', contribution: -100 })),
      ).not.toThrow()
      expect(result.current.participants.map((p) => p.name)).toEqual(['Franco'])
    })

    it('keeps the undo available when an invalid add is ignored', () => {
      const { result } = setup(referenceParticipants)
      act(() => result.current.resetAsado())
      act(() => result.current.addParticipant({ name: '', contribution: 0 }))
      expect(result.current.canUndoReset).toBe(true)
    })
  })

  it('ignores a double remove', () => {
    const { result } = setup(referenceParticipants)
    act(() => {
      result.current.removeParticipant('pica')
      result.current.removeParticipant('pica')
    })
    expect(result.current.participants.map((p) => p.id)).not.toContain('pica')
    expect(result.current.participants).toHaveLength(8)
  })

  it('saves every change to storage', () => {
    const { result, storage } = setup()
    act(() => result.current.addParticipant({ name: 'Franco', contribution: 18000000 }))
    expect(loadAsado(storage).participants).toEqual([referenceParticipants[0]])
  })

  it('keeps action identities stable across renders', () => {
    const { result } = setup()
    const before = result.current
    act(() => result.current.addParticipant({ name: 'Franco', contribution: 100 }))
    const after = result.current
    expect(after.addParticipant).toBe(before.addParticipant)
    expect(after.updateParticipant).toBe(before.updateParticipant)
    expect(after.removeParticipant).toBe(before.removeParticipant)
    expect(after.resetAsado).toBe(before.resetAsado)
    expect(after.undoReset).toBe(before.undoReset)
    expect(after.dismissUndo).toBe(before.dismissUndo)
    expect(after.dismissRestoreNotice).toBe(before.dismissRestoreNotice)
  })

  describe('reset with undo', () => {
    it('resets immediately, clears storage and offers undo', () => {
      const { result, storage } = setup(referenceParticipants)
      act(() => result.current.resetAsado())
      expect(result.current.participants).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.canUndoReset).toBe(true)
      expect(storage.data.has(STORAGE_KEY)).toBe(false)
    })

    it('undo restores the exact list and saves it again', () => {
      const { result, storage } = setup(referenceParticipants)
      act(() => result.current.resetAsado())
      act(() => result.current.undoReset())
      expect(result.current.participants).toEqual(referenceParticipants)
      expect(result.current.transfers).toEqual(referenceTransfers)
      expect(result.current.canUndoReset).toBe(false)
      expect(loadAsado(storage).participants).toEqual(referenceParticipants)
    })

    it('dismissing makes the reset final', () => {
      const { result } = setup(referenceParticipants)
      act(() => result.current.resetAsado())
      act(() => result.current.dismissUndo())
      expect(result.current.canUndoReset).toBe(false)
      act(() => result.current.undoReset())
      expect(result.current.participants).toEqual([])
    })

    it('adding after a reset drops the undo', () => {
      const { result } = setup(referenceParticipants)
      act(() => result.current.resetAsado())
      act(() => result.current.addParticipant({ name: 'Franco', contribution: 500000 }))
      expect(result.current.canUndoReset).toBe(false)
      act(() => result.current.undoReset())
      expect(result.current.participants.map((p) => p.name)).toEqual(['Franco'])
    })

    it('does nothing when there is nothing to reset', () => {
      const { result } = setup()
      act(() => result.current.resetAsado())
      expect(result.current.canUndoReset).toBe(false)
    })
  })

  describe('recovery notice', () => {
    it('is raised when stored data is discarded, and the bad key is removed', () => {
      const { result, storage } = setup('{not json')
      expect(result.current.participants).toEqual([])
      expect(result.current.restoreFailed).toBe(true)
      expect(storage.data.has(STORAGE_KEY)).toBe(false)
    })

    it('is raised for an invalid participant', () => {
      const { result } = setup(
        JSON.stringify({
          version: 1,
          participants: [{ id: 'a', name: 'Franco', contribution: -500 }],
        }),
      )
      expect(result.current.restoreFailed).toBe(true)
    })

    it('is not raised for valid data', () => {
      expect(setup(referenceParticipants).result.current.restoreFailed).toBe(false)
    })

    it('is cleared by dismissRestoreNotice', () => {
      const { result } = setup('{not json')
      act(() => result.current.dismissRestoreNotice())
      expect(result.current.restoreFailed).toBe(false)
    })

    it('is cleared by adding a participant', () => {
      const { result } = setup('{not json')
      act(() => result.current.addParticipant({ name: 'Franco', contribution: 18000000 }))
      expect(result.current.restoreFailed).toBe(false)
      expect(result.current.participants.map((p) => p.name)).toEqual(['Franco'])
    })

    it('is not raised again after a reload', () => {
      const { storage, unmount } = setup('{not json')
      unmount()
      const reloaded = renderHook(() => useAsado({ storage }))
      expect(reloaded.result.current.restoreFailed).toBe(false)
    })
  })
})

describe('useAsado without injected deps (jsdom localStorage)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads a saved asado', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, participants: referenceParticipants }),
    )
    const { result } = renderHook(() => useAsado())
    expect(result.current.participants).toEqual(referenceParticipants)
    expect(result.current.transfers).toEqual(referenceTransfers)
    expect(result.current.restoreFailed).toBe(false)
  })

  it('persists changes and survives a re-mount', () => {
    const first = renderHook(() => useAsado())
    act(() => first.result.current.addParticipant({ name: 'Franco', contribution: 18000000 }))
    act(() => first.result.current.addParticipant({ name: 'Pica', contribution: 4200000 }))
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')
    expect(saved.version).toBe(1)
    expect(saved.participants.map((p: Participant) => p.name)).toEqual(['Franco', 'Pica'])
    expect(saved.participants[0].id).toMatch(/\S/)
    first.unmount()

    const second = renderHook(() => useAsado())
    expect(second.result.current.participants).toEqual(saved.participants)
  })

  it('starts empty, flags the recovery notice and removes a corrupted key', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    const { result } = renderHook(() => useAsado())
    expect(result.current.participants).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.restoreFailed).toBe(true)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
