import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { ShareStatus } from '../../../hooks/useShareSummary'

interface ShareTextButtonProps {
  status: ShareStatus
  onShare: () => void
}

const messages: Record<ShareStatus, string> = {
  idle: '',
  shared: 'Listo, compartido.',
  copied: 'Copiado. Pegalo en el grupo.',
  error: 'No se pudo compartir. Probá de nuevo.',
}

/** Quiet secondary action: shares the plain-text summary, with its own status (spec share-summary). */
export function ShareTextButton({ status, onShare }: ShareTextButtonProps) {
  return (
    <Box sx={{ mt: 1 }}>
      <Button variant="text" fullWidth onClick={onShare}>
        Compartir como texto
      </Button>
      <Typography
        role="status"
        aria-live="polite"
        variant="body2"
        sx={{
          minHeight: '1.5em',
          textAlign: 'center',
          color: status === 'error' ? 'error.main' : 'text.secondary',
        }}
      >
        {messages[status]}
      </Typography>
    </Box>
  )
}
