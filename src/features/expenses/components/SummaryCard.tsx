import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { formatMoney } from '../../../domain/services/money'
import { roundingNote } from '../../../lib/roundingNote'
import { SummaryRow } from './SummaryRow'

interface SummaryCardProps {
  total: number
  count: number
  share: number
  surplus: number
  surplusRecipientName?: string
}

/** The pizarra: a flat chalkboard slab with the asado's numbers (design D11). */
export function SummaryCard({
  total,
  count,
  share,
  surplus,
  surplusRecipientName,
}: SummaryCardProps) {
  const note = roundingNote(surplus, surplusRecipientName)
  return (
    <Box sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: 'pizarra.main', borderRadius: 1 }}>
      <Box component="dl" sx={{ m: 0 }}>
        <SummaryRow label="Total" emphasis>
          {formatMoney(total)}
        </SummaryRow>
        <SummaryRow label="Personas">{count === 1 ? '1 persona' : `${count} personas`}</SummaryRow>
        <SummaryRow label="Le toca a cada uno">{formatMoney(share)}</SummaryRow>
      </Box>
      {note && (
        <Typography variant="body2" sx={{ mt: 1.5, color: 'pizarra.muted' }}>
          {note}
        </Typography>
      )}
    </Box>
  )
}
