import IosShare from '@mui/icons-material/IosShare'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { ShareImagesStatus } from '../../../hooks/useShareImages'

interface ShareImageButtonProps {
  label: string
  status: ShareImagesStatus
  onShare: () => void
}

const messages: Record<ShareImagesStatus, string> = {
  idle: '',
  shared: 'Listo, compartido.',
  downloaded: 'Listo, descargado.',
  error: 'No se pudo compartir. Probá de nuevo.',
}

/**
 * Shares one image (all its pages) and announces the outcome right below itself; the live
 * region stays mounted so updates are read (design D5).
 */
export function ShareImageButton({ label, status, onShare }: ShareImageButtonProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Button variant="outlined" size="large" fullWidth startIcon={<IosShare />} onClick={onShare}>
        {label}
      </Button>
      <Typography
        role="status"
        aria-live="polite"
        variant="body2"
        sx={{
          minHeight: '1.5em',
          mt: 0.5,
          textAlign: 'center',
          color: status === 'error' ? 'error.main' : 'text.secondary',
        }}
      >
        {messages[status]}
      </Typography>
    </Box>
  )
}
