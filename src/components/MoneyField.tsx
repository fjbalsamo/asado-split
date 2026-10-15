import TextField from '@mui/material/TextField'
import { useField } from 'formik'
import type { FocusEvent, Ref } from 'react'
import { formatMoney, parseMoney } from '../domain/services/money'

interface MoneyFieldProps {
  name: string
  label: string
  helperText?: string
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Formik-bound amount input. On blur, a valid amount is rewritten as es-AR currency
 * (e.g. "1500" → "$ 1.500") so the user sees how it was read; empty and invalid values
 * are left untouched (design D7).
 */
export function MoneyField({ name, label, helperText, inputRef }: MoneyFieldProps) {
  const [field, meta, helpers] = useField<string>(name)
  const showError = meta.touched && Boolean(meta.error)

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    field.onBlur(event)
    if (field.value.trim() === '') return
    const parsed = parseMoney(field.value)
    if (parsed.ok) void helpers.setValue(formatMoney(parsed.value))
  }

  return (
    <TextField
      {...field}
      onBlur={handleBlur}
      inputRef={inputRef}
      label={label}
      fullWidth
      error={showError}
      helperText={showError ? meta.error : helperText}
      slotProps={{
        htmlInput: { inputMode: 'numeric', enterKeyHint: 'done', autoComplete: 'off' },
      }}
    />
  )
}
