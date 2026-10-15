import Button from '@mui/material/Button'

interface ResetButtonProps {
  onReset: () => void
}

/** One tap resets; safety comes from the "Deshacer" snackbar, not a confirmation step. */
export function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <Button variant="text" fullWidth onClick={onReset} sx={{ color: 'text.secondary' }}>
      Empezar otro asado
    </Button>
  )
}
