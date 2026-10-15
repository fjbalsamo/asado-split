import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { useState } from 'react'
import { EmptyState } from '../../../components/EmptyState'
import type { Participant } from '../../../domain/models/participant'
import type { ParticipantDraft } from '../../../domain/services/participants'
import { ParticipantEditForm } from './ParticipantEditForm'
import { ParticipantItem } from './ParticipantItem'

interface ParticipantListProps {
  participants: readonly Participant[]
  onUpdate: (id: string, draft: ParticipantDraft) => void
  onRemove: (id: string) => void
}

/**
 * Renders each participant as a read-only row or, for at most one, the inline edit form.
 * Item and edit form are siblings chosen here, keeping prop depth from App at 2 (design D9).
 */
export function ParticipantList({ participants, onUpdate, onRemove }: ParticipantListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [returnFocusId, setReturnFocusId] = useState<string | null>(null)

  if (participants.length === 0) {
    return <EmptyState message="Todavía no hay nadie. Agregá a alguien para arrancar." />
  }

  const startEditing = (id: string) => {
    setReturnFocusId(null)
    setEditingId(id)
  }
  const stopEditing = (id: string) => {
    setEditingId(null)
    setReturnFocusId(id)
  }

  return (
    <List disablePadding>
      {participants.map((participant) =>
        participant.id === editingId ? (
          <ListItem key={participant.id} disableGutters divider sx={{ display: 'block' }}>
            <ParticipantEditForm
              participant={participant}
              participants={participants}
              onSave={(draft) => {
                onUpdate(participant.id, draft)
                stopEditing(participant.id)
              }}
              onCancel={() => stopEditing(participant.id)}
            />
          </ListItem>
        ) : (
          <ParticipantItem
            key={participant.id}
            participant={participant}
            onEdit={startEditing}
            onRemove={onRemove}
            focusEditButton={participant.id === returnFocusId}
          />
        ),
      )}
    </List>
  )
}
