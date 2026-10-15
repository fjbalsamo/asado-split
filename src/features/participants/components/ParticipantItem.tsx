import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import { useEffect, useRef } from 'react'
import type { Participant } from '../../../domain/models/participant'
import { formatMoney } from '../../../domain/services/money'

interface ParticipantItemProps {
  participant: Participant
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  /** Return focus here after leaving edit mode, so keyboard users keep their place. */
  focusEditButton?: boolean
}

export function ParticipantItem({
  participant,
  onEdit,
  onRemove,
  focusEditButton = false,
}: ParticipantItemProps) {
  const editRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusEditButton) editRef.current?.focus()
  }, [focusEditButton])

  return (
    <ListItem disableGutters divider>
      <ListItemText
        primary={participant.name}
        secondary={`Puso ${formatMoney(participant.contribution)}`}
        slotProps={{
          primary: { sx: { fontWeight: 600, overflowWrap: 'anywhere' } },
          secondary: { sx: { color: 'text.secondary' } },
        }}
      />
      <Stack direction="row" sx={{ flexShrink: 0 }}>
        <IconButton
          ref={editRef}
          aria-label={`Editar a ${participant.name}`}
          onClick={() => onEdit(participant.id)}
        >
          <EditOutlined />
        </IconButton>
        <IconButton
          aria-label={`Sacar a ${participant.name}`}
          onClick={() => onRemove(participant.id)}
        >
          <DeleteOutlined />
        </IconButton>
      </Stack>
    </ListItem>
  )
}
