import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useId, type ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
}

/** A titled page section; the heading labels the landmark for assistive tech. */
export function Section({ title, children }: SectionProps) {
  const headingId = useId()
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ py: 3 }}>
      <Typography variant="h2" id={headingId} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}
