import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface SummaryRowProps {
  label: string
  children: ReactNode
  /** The total: large chalk numerals, the pizarra's one loud element. */
  emphasis?: boolean
}

/** One label/value pair on the pizarra, as <dt>/<dd>. */
export function SummaryRow({ label, children, emphasis = false }: SummaryRowProps) {
  return (
    <Box sx={{ '& + &': { mt: 2 } }}>
      <Typography component="dt" variant="body2" sx={{ color: 'pizarra.muted' }}>
        {label}
      </Typography>
      <Typography
        component="dd"
        variant={emphasis ? 'h3' : 'h2'}
        sx={{ m: 0, color: 'pizarra.contrastText', fontSize: emphasis ? undefined : '1.25rem' }}
      >
        {children}
      </Typography>
    </Box>
  )
}
