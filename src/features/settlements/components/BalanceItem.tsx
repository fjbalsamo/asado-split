import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { formatMoney } from '../../../domain/services/money'

interface BalanceItemProps {
  name: string
  amount: number
}

function describe(amount: number): { text: string; color: string } {
  if (amount > 0) return { text: `Recibe ${formatMoney(amount)}`, color: 'receives.main' }
  if (amount < 0) return { text: `Pone ${formatMoney(-amount)}`, color: 'text.primary' }
  return { text: 'Está al día', color: 'text.secondary' }
}

/** Meaning is carried by the words "Recibe" / "Pone" / "Está al día"; color only reinforces it. */
export function BalanceItem({ name, amount }: BalanceItemProps) {
  const { text, color } = describe(amount)
  return (
    <ListItem disableGutters sx={{ py: 0.75, justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ overflowWrap: 'anywhere' }}>{name}</Typography>{' '}
      <Typography sx={{ color, fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</Typography>
    </ListItem>
  )
}
