import Close from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'

interface RestoreNoticeProps {
  onClose: () => void
}

/** Inline, non-blocking notice shown once when a saved asado had to be discarded. */
export function RestoreNotice({ onClose }: RestoreNoticeProps) {
  return (
    <Alert
      severity="info"
      role="status"
      sx={{ mb: 2, alignItems: 'center' }}
      action={
        <IconButton aria-label="Cerrar aviso" onClick={onClose}>
          <Close />
        </IconButton>
      }
    >
      No pudimos recuperar el asado guardado. Empezamos uno nuevo.
    </Alert>
  )
}
