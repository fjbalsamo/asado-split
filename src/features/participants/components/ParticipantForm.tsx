import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Form, Formik, type FormikHelpers } from 'formik'
import { useMemo, useRef } from 'react'
import { MoneyField } from '../../../components/MoneyField'
import type { Participant } from '../../../domain/models/participant'
import type { ParticipantDraft } from '../../../domain/services/participants'
import {
  createParticipantSchema,
  toParticipantDraft,
  type ParticipantFormValues,
} from '../schemas/participantSchema'

interface ParticipantFormProps {
  participants: readonly Participant[]
  onAdd: (draft: ParticipantDraft) => void
}

const emptyValues: ParticipantFormValues = { name: '', contribution: '' }

/** Always-visible add form: name + "Cuánto puso". Clears and refocuses the name after adding. */
export function ParticipantForm({ participants, onAdd }: ParticipantFormProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const schema = useMemo(() => createParticipantSchema(participants), [participants])

  const handleSubmit = (
    values: ParticipantFormValues,
    { resetForm }: FormikHelpers<ParticipantFormValues>,
  ) => {
    onAdd(toParticipantDraft(values))
    resetForm()
    nameRef.current?.focus()
  }

  return (
    <Formik initialValues={emptyValues} validationSchema={schema} onSubmit={handleSubmit}>
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Form noValidate>
          <Stack spacing={2}>
            <TextField
              name="name"
              label="Nombre"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              inputRef={nameRef}
              fullWidth
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name ? errors.name : undefined}
              slotProps={{ htmlInput: { autoComplete: 'off', enterKeyHint: 'next' } }}
            />
            <MoneyField
              name="contribution"
              label="Cuánto puso"
              helperText="En pesos. Dejalo vacío si no puso nada."
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              Agregar
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  )
}
