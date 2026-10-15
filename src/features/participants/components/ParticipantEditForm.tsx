import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Form, Formik } from 'formik'
import { useMemo } from 'react'
import { MoneyField } from '../../../components/MoneyField'
import type { Participant } from '../../../domain/models/participant'
import { formatMoney } from '../../../domain/services/money'
import type { ParticipantDraft } from '../../../domain/services/participants'
import {
  createParticipantSchema,
  toParticipantDraft,
  type ParticipantFormValues,
} from '../schemas/participantSchema'

interface ParticipantEditFormProps {
  participant: Participant
  participants: readonly Participant[]
  onSave: (draft: ParticipantDraft) => void
  onCancel: () => void
}

/** Inline edit row (no modal). Uniqueness ignores the participant being edited. */
export function ParticipantEditForm({
  participant,
  participants,
  onSave,
  onCancel,
}: ParticipantEditFormProps) {
  const schema = useMemo(
    () => createParticipantSchema(participants, participant.id),
    [participants, participant.id],
  )
  const initialValues: ParticipantFormValues = {
    name: participant.name,
    contribution: formatMoney(participant.contribution),
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values) => onSave(toParticipantDraft(values))}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Form noValidate aria-label={`Editar a ${participant.name}`}>
          <Stack spacing={2} sx={{ py: 2 }}>
            <TextField
              name="name"
              label="Nombre"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoFocus
              fullWidth
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name ? errors.name : undefined}
              slotProps={{ htmlInput: { autoComplete: 'off', enterKeyHint: 'next' } }}
            />
            <MoneyField name="contribution" label="Cuánto puso" />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" sx={{ flex: 1 }}>
                Guardar
              </Button>
              <Button type="button" onClick={onCancel} sx={{ flex: 1 }}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </Form>
      )}
    </Formik>
  )
}
