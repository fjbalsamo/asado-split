import { object, string } from 'yup'
import type { Participant } from '../../../domain/models/participant'
import { parseMoney, type MoneyParseError } from '../../../domain/services/money'
import {
  isNameTaken,
  MAX_NAME_LENGTH,
  normalizeName,
  type ParticipantDraft,
} from '../../../domain/services/participants'

/** Exact es-AR strings from the specs (participant-management, money). */
export const participantMessages = {
  nameRequired: 'Ingresá un nombre.',
  nameTooLong: 'Usá hasta 40 caracteres.',
  nameTaken: 'Ya hay alguien que se llama así.',
  amountFormat: 'Ingresá un monto válido, por ejemplo 15000.',
  amountNegative: 'El monto no puede ser negativo.',
  amountDecimals: 'Poné el monto sin centavos.',
  amountMax: 'El monto no puede superar los $ 100.000.000.',
} as const

const amountMessages: Record<MoneyParseError, string> = {
  format: participantMessages.amountFormat,
  negative: participantMessages.amountNegative,
  decimals: participantMessages.amountDecimals,
  max: participantMessages.amountMax,
}

/** Raw form values: both fields are text as typed (or blur-formatted). */
export interface ParticipantFormValues {
  name: string
  contribution: string
}

/**
 * Validation for the add and edit forms. Owns the uniqueness rule against the current list
 * (design D13); `exceptId` lets a participant keep their own name while editing.
 */
export function createParticipantSchema(participants: readonly Participant[], exceptId?: string) {
  return object({
    name: string()
      .trim()
      .required(participantMessages.nameRequired)
      .max(MAX_NAME_LENGTH, participantMessages.nameTooLong)
      .test(
        'unique-name',
        participantMessages.nameTaken,
        (name) => !isNameTaken(participants, name, exceptId),
      ),
    // Formik turns "" into undefined before validating; an empty amount means $ 0,00.
    contribution: string().test('money', (value, context) => {
      const parsed = parseMoney(value ?? '')
      return parsed.ok || context.createError({ message: amountMessages[parsed.error] })
    }),
  })
}

/** Converts validated form values to a domain draft (trimmed name, integer centavos). */
export function toParticipantDraft(values: ParticipantFormValues): ParticipantDraft {
  const parsed = parseMoney(values.contribution)
  // Only called after validation; NaN would be rejected by the domain if it ever got through.
  return { name: normalizeName(values.name), contribution: parsed.ok ? parsed.value : Number.NaN }
}
