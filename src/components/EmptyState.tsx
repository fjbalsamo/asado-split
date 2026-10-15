import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Typography color="text.secondary" sx={{ py: 2 }}>
      {message}
    </Typography>
  )
}
