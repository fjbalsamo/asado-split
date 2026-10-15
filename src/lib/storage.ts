import type { Participant } from '../domain/models/participant'
import { addParticipant } from '../domain/services/participants'

export const STORAGE_KEY = 'asado-split'
export const SCHEMA_VERSION = 1

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** none: nothing stored or storage unreadable · restored: valid data · discarded: invalid data. */
export type LoadStatus = 'none' | 'restored' | 'discarded'

export interface LoadResult {
  participants: readonly Participant[]
  status: LoadStatus
}

interface StoredAsado {
  version: typeof SCHEMA_VERSION
  participants: readonly Participant[]
}

/** localStorage, or undefined when it is missing or access throws (private mode, sandboxing). */
function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isParticipantShape(value: unknown): value is Participant {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.contribution === 'number'
  )
}

/**
 * Rebuilds the list through the domain so every invariant (non-empty unique names and ids,
 * non-negative safe-integer contributions) is enforced. Any violation discards everything (null).
 */
function toParticipants(raw: unknown): readonly Participant[] | null {
  if (!isRecord(raw) || raw.version !== SCHEMA_VERSION || !Array.isArray(raw.participants)) {
    return null
  }
  let list: readonly Participant[] = []
  for (const entry of raw.participants) {
    if (!isParticipantShape(entry)) return null
    const result = addParticipant(list, entry)
    if (!result.ok) return null
    list = result.participants
  }
  return list
}

/** Loads the saved asado. Never throws; any failure yields no participants. */
export function loadAsado(storage: StorageLike | undefined = browserStorage()): LoadResult {
  let raw: string | null | undefined
  try {
    raw = storage?.getItem(STORAGE_KEY)
  } catch {
    return { participants: [], status: 'none' }
  }
  if (!raw) return { participants: [], status: 'none' }

  let participants: readonly Participant[] | null
  try {
    participants = toParticipants(JSON.parse(raw))
  } catch {
    participants = null
  }
  return participants
    ? { participants, status: 'restored' }
    : { participants: [], status: 'discarded' }
}

/** Saves participants only (never derived values). An empty list removes the key. Never throws. */
export function saveParticipants(
  participants: readonly Participant[],
  storage: StorageLike | undefined = browserStorage(),
): void {
  try {
    if (participants.length === 0) {
      storage?.removeItem(STORAGE_KEY)
      return
    }
    const value: StoredAsado = { version: SCHEMA_VERSION, participants }
    storage?.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked: the app keeps working in memory.
  }
}
