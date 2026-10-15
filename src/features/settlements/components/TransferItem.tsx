import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { formatMoney } from '../../../domain/services/money'

interface TransferItemProps {
  from: string
  to: string
  amount: number
}

/** "Tito le transfiere $ 29.112 a Franco", with names and amount in bold. */
export function TransferItem({ from, to, amount }: TransferItemProps) {
  return (
    <ListItem disableGutters divider sx={{ py: 1.5 }}>
      <Typography>
        <strong>{from}</strong> le transfiere <strong>{formatMoney(amount)}</strong> a{' '}
        <strong>{to}</strong>
      </Typography>
    </ListItem>
  )
}
