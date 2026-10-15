import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import type { Balance } from '../../../domain/models/balance'
import type { Participant } from '../../../domain/models/participant'
import { BalanceItem } from './BalanceItem'

interface BalanceListProps {
  balances: readonly Balance[]
  participants: readonly Participant[]
}

export function BalanceList({ balances, participants }: BalanceListProps) {
  const names = new Map(participants.map((p) => [p.id, p.name]))
  return (
    <Box sx={{ mt: 3 }}>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        Cómo quedó cada uno
      </Typography>
      <List disablePadding dense>
        {balances.map((b) => (
          <BalanceItem
            key={b.participantId}
            name={names.get(b.participantId) ?? ''}
            amount={b.amount}
          />
        ))}
      </List>
    </Box>
  )
}
