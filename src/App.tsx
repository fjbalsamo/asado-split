import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import { useMemo } from 'react'
import { AppHeader } from './components/AppHeader'
import { Section } from './components/Section'
import { SummaryCard } from './features/expenses'
import { ParticipantForm, ParticipantList, RestoreNotice } from './features/participants'
import {
  BalanceList,
  buildImagePages,
  buildShareText,
  ResetButton,
  ShareImageButton,
  ShareTextButton,
  TransferList,
  UndoResetSnackbar,
} from './features/settlements'
import { useAsado } from './hooks/useAsado'
import { useShareImages } from './hooks/useShareImages'
import { useShareSummary } from './hooks/useShareSummary'

/** The only consumer of the hooks; composes the single-page flow (design D9). */
function App() {
  const asado = useAsado()
  const { participants, total, share, surplus, surplusRecipientId, balances, transfers } = asado
  const shareText = useMemo(
    () => buildShareText({ participants, total, share, surplus, surplusRecipientId, transfers }),
    [participants, total, share, surplus, surplusRecipientId, transfers],
  )
  const { status: textStatus, share: shareTextSummary } = useShareSummary(shareText)
  const pages = useMemo(
    () =>
      buildImagePages({
        participants,
        total,
        share,
        surplus,
        surplusRecipientId,
        balances,
        transfers,
        today: new Date(),
      }),
    [participants, total, share, surplus, surplusRecipientId, balances, transfers],
  )
  const transfersPages = useMemo(() => pages.filter((p) => p.kind === 'transfers'), [pages])
  const contributionsPages = useMemo(() => pages.filter((p) => p.kind === 'contributions'), [pages])
  const transfersImage = useShareImages(transfersPages)
  const contributionsImage = useShareImages(contributionsPages)
  const hasParticipants = participants.length > 0
  const surplusRecipientName = participants.find((p) => p.id === surplusRecipientId)?.name

  return (
    <Container maxWidth="sm" sx={{ pb: 6 }}>
      <AppHeader />
      <Box component="main">
        <Section title="Quiénes vinieron">
          {asado.restoreFailed && <RestoreNotice onClose={asado.dismissRestoreNotice} />}
          <ParticipantForm participants={participants} onAdd={asado.addParticipant} />
          <Box sx={{ mt: 2 }}>
            <ParticipantList
              participants={participants}
              onUpdate={asado.updateParticipant}
              onRemove={asado.removeParticipant}
            />
          </Box>
        </Section>

        {hasParticipants && (
          <>
            <Divider />
            <Section title="Las cuentas">
              <SummaryCard
                total={total}
                count={participants.length}
                share={share}
                surplus={surplus}
                surplusRecipientName={surplusRecipientName}
              />
            </Section>
            <Divider />
            <Section title="Quién le transfiere a quién">
              <TransferList transfers={transfers} participants={participants} />
              {transfers.length > 0 && (
                <ShareImageButton
                  label="Compartir transferencias"
                  status={transfersImage.status}
                  onShare={() => void transfersImage.share()}
                />
              )}
              <BalanceList balances={balances} participants={participants} />
              <ShareImageButton
                label="Compartir aportes"
                status={contributionsImage.status}
                onShare={() => void contributionsImage.share()}
              />
              <ShareTextButton status={textStatus} onShare={() => void shareTextSummary()} />
            </Section>
            <ResetButton onReset={asado.resetAsado} />
          </>
        )}
      </Box>
      <UndoResetSnackbar
        open={asado.canUndoReset}
        onUndo={asado.undoReset}
        onDismiss={asado.dismissUndo}
      />
    </Container>
  )
}

export default App
