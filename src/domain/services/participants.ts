import type { Participant } from '../models/participant'
import { CENTAVOS_PER_PESO } from './money'

export const MAX_NAME_LENGTH = 40

export type ParticipantDraft = Pick<Participant, 'name' | 'contribution'>

export type ParticipantErrorCode =
  | 'empty-name'
  | 'name-too-long'
  | 'duplicate-name'
  | 'empty-id'
  | 'duplicate-id'
  | 'invalid-contribution'

/** List operations never throw: invalid input is reported as a typed error (design D2, D13). */
export type ParticipantListResult =
  { ok: true; participants: readonly Participant[] } | { ok: false; error: ParticipantErrorCode }

export function normalizeName(name: string): string {
  return name.trim()
}

function nameKey(name: string): string {
  return normalizeName(name).toLocaleLowerCase('es-AR')
}

/** True if another participant (other than `exceptId`) has the same trimmed, case-insensitive name. */
export function isNameTaken(
  participants: readonly Participant[],
  name: string,
  exceptId?: string,
): boolean {
  const key = nameKey(name)
  return participants.some((p) => p.id !== exceptId && nameKey(p.name) === key)
}

function draftError(
  participants: readonly Participant[],
  draft: ParticipantDraft,
  id: string,
): ParticipantErrorCode | null {
  const name = normalizeName(draft.name)
  if (name === '') return 'empty-name'
  if (name.length > MAX_NAME_LENGTH) return 'name-too-long'
  if (isNameTaken(participants, name, id)) return 'duplicate-name'
  const { contribution } = draft
  // Whole pesos only: a non-negative safe integer of centavos that is a multiple of 100.
  if (
    !Number.isSafeInteger(contribution) ||
    contribution < 0 ||
    contribution % CENTAVOS_PER_PESO !== 0
  ) {
    return 'invalid-contribution'
  }
  return null
}

/** Appends a participant at the end (insertion order breaks ties for the rounding surplus). */
export function addParticipant(
  participants: readonly Participant[],
  participant: Participant,
): ParticipantListResult {
  if (participant.id === '') return { ok: false, error: 'empty-id' }
  if (participants.some((p) => p.id === participant.id)) return { ok: false, error: 'duplicate-id' }
  const error = draftError(participants, participant, participant.id)
  if (error) return { ok: false, error }
  return {
    ok: true,
    participants: [...participants, { ...participant, name: normalizeName(participant.name) }],
  }
}

/** Replaces name and contribution in place, keeping the position. Unknown ids are a no-op. */
export function updateParticipant(
  participants: readonly Participant[],
  id: string,
  draft: ParticipantDraft,
): ParticipantListResult {
  if (!participants.some((p) => p.id === id)) return { ok: true, participants }
  const error = draftError(participants, draft, id)
  if (error) return { ok: false, error }
  const name = normalizeName(draft.name)
  return {
    ok: true,
    participants: participants.map((p) =>
      p.id === id ? { id, name, contribution: draft.contribution } : p,
    ),
  }
}

/** Removes by id, keeping relative order. Unknown ids return the same list. */
export function removeParticipant(
  participants: readonly Participant[],
  id: string,
): readonly Participant[] {
  const next = participants.filter((p) => p.id !== id)
  return next.length === participants.length ? participants : next
}
