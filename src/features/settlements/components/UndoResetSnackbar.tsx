import Button from '@mui/material/Button'
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar'

/** How long "Deshacer" stays available after a reset. */
export const UNDO_WINDOW_MS = 6000

interface UndoResetSnackbarProps {
  open: boolean
  onUndo: () => void
  onDismiss: () => void
}

/** Non-blocking undo for "Empezar otro asado". A stray tap elsewhere does not drop the undo. */
export function UndoResetSnackbar({ open, onUndo, onDismiss }: UndoResetSnackbarProps) {
  const handleClose = (_event: unknown, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return
    onDismiss()
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={UNDO_WINDOW_MS}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message="Asado borrado"
      action={
        <Button size="large" onClick={onUndo} sx={{ fontWeight: 700 }}>
          Deshacer
        </Button>
      }
    />
  )
}
