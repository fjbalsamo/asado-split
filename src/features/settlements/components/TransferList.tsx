import List from '@mui/material/List'
import { EmptyState } from '../../../components/EmptyState'
import type { Participant } from '../../../domain/models/participant'
import type { Transfer } from '../../../domain/models/transfer'
import { TransferItem } from './TransferItem'

interface TransferListProps {
  transfers: readonly Transfer[]
  participants: readonly Participant[]
}

export function TransferList({ transfers, participants }: TransferListProps) {
  if (transfers.length === 0) return <EmptyState message="Nadie le debe nada a nadie." />

  const names = new Map(participants.map((p) => [p.id, p.name]))
  return (
    <List disablePadding>
      {transfers.map((t) => (
        <TransferItem
          key={`${t.from}-${t.to}`}
          from={names.get(t.from) ?? ''}
          to={names.get(t.to) ?? ''}
          amount={t.amount}
        />
      ))}
    </List>
  )
}
