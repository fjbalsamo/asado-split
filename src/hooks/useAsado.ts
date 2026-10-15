import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import type { Balance } from '../domain/models/balance'
import type { Participant } from '../domain/models/participant'
import type { Transfer } from '../domain/models/transfer'
import { computeBalances } from '../domain/services/balances'
import {
  addParticipant as addToList,
  removeParticipant as removeFromList,
  updateParticipant as updateInList,
  type ParticipantDraft,
} from '../domain/services/participants'
import { settle } from '../domain/services/settlement'
import { computeSplit, computeTotal } from '../domain/services/split'
import { createId as defaultCreateId } from '../lib/id'
import { loadAsado, saveParticipants, type StorageLike } from '../lib/storage'

export interface AsadoDeps {
  storage?: StorageLike
  createId?: () => string
}

export interface UseAsadoResult {
  participants: readonly Participant[]
  total: number
  /** Everyone's equal share, rounded up to a whole peso. */
  share: number
  /** Rounding surplus (n × share − total), kept by `surplusRecipientId`. */
  surplus: number
  surplusRecipientId: string | null
  balances: readonly Balance[]
  transfers: readonly Transfer[]
  canUndoReset: boolean
  /** Saved data existed but was invalid and was discarded; show the recovery message. */
  restoreFailed: boolean
  addParticipant: (draft: ParticipantDraft) => void
  updateParticipant: (id: string, draft: ParticipantDraft) => void
  removeParticipant: (id: string) => void
  resetAsado: () => void
  undoReset: () => void
  dismissUndo: () => void
  dismissRestoreNotice: () => void
}

interface AsadoState {
  participants: readonly Participant[]
  /** List as it was before the last reset; in memory only, never persisted. */
  undoSnapshot: readonly Participant[] | null
  restoreFailed: boolean
}

type AsadoAction =
  | { type: 'add'; participant: Participant }
  | { type: 'update'; id: string; draft: ParticipantDraft }
  | { type: 'remove'; id: string }
  | { type: 'reset' }
  | { type: 'undo' }
  | { type: 'dismissUndo' }
  | { type: 'dismissRestoreNotice' }

/**
 * Pure transitions over domain results. Invalid input is ignored (state returned unchanged),
 * so nothing ever throws inside a React state update (design D13).
 */
function reducer(state: AsadoState, action: AsadoAction): AsadoState {
  switch (action.type) {
    case 'add': {
      const result = addToList(state.participants, action.participant)
      if (!result.ok) return state
      return { participants: result.participants, undoSnapshot: null, restoreFailed: false }
    }
    case 'update': {
      const result = updateInList(state.participants, action.id, action.draft)
      if (!result.ok || result.participants === state.participants) return state
      return { ...state, participants: result.participants }
    }
    case 'remove': {
      const participants = removeFromList(state.participants, action.id)
      return participants === state.participants ? state : { ...state, participants }
    }
    case 'reset':
      if (state.participants.length === 0) return state
      return { ...state, participants: [], undoSnapshot: state.participants }
    case 'undo':
      if (state.undoSnapshot === null) return state
      return { ...state, participants: state.undoSnapshot, undoSnapshot: null }
    case 'dismissUndo':
      return state.undoSnapshot === null ? state : { ...state, undoSnapshot: null }
    case 'dismissRestoreNotice':
      return state.restoreFailed ? { ...state, restoreFailed: false } : state
  }
}

/** Asado state, persistence and derived settlement. All rules live in src/domain. */
export function useAsado(deps: AsadoDeps = {}): UseAsadoResult {
  const [{ storage, createId }] = useState(() => ({
    storage: deps.storage,
    createId: deps.createId ?? defaultCreateId,
  }))
  const [state, dispatch] = useReducer(reducer, undefined, (): AsadoState => {
    const { participants, status } = loadAsado(storage)
    return { participants, undoSnapshot: null, restoreFailed: status === 'discarded' }
  })
  const { participants, undoSnapshot, restoreFailed } = state

  useEffect(() => {
    saveParticipants(participants, storage)
  }, [participants, storage])

  const derived = useMemo(() => {
    const balances = computeBalances(participants)
    return {
      total: computeTotal(participants),
      ...computeSplit(participants),
      balances,
      transfers: settle(balances),
    }
  }, [participants])

  const addParticipant = useCallback(
    (draft: ParticipantDraft) =>
      dispatch({ type: 'add', participant: { id: createId(), ...draft } }),
    [createId],
  )
  const updateParticipant = useCallback(
    (id: string, draft: ParticipantDraft) => dispatch({ type: 'update', id, draft }),
    [],
  )
  const removeParticipant = useCallback((id: string) => dispatch({ type: 'remove', id }), [])
  const resetAsado = useCallback(() => dispatch({ type: 'reset' }), [])
  const undoReset = useCallback(() => dispatch({ type: 'undo' }), [])
  const dismissUndo = useCallback(() => dispatch({ type: 'dismissUndo' }), [])
  const dismissRestoreNotice = useCallback(() => dispatch({ type: 'dismissRestoreNotice' }), [])

  return {
    participants,
    ...derived,
    canUndoReset: undoSnapshot !== null,
    restoreFailed,
    addParticipant,
    updateParticipant,
    removeParticipant,
    resetAsado,
    undoReset,
    dismissUndo,
    dismissRestoreNotice,
  }
}
