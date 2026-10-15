# Proposal

## Why

In a WhatsApp group, a picture of the results is read at a glance and is harder to misread than a block of text. Friends want to see "who sends how much to whom" and "what everyone put in" without opening the app. Today "Compartir cuentas" only shares plain text.

## What Changes

- Two image share buttons, one per image, each placed right below the list it shares:
  1. **"Compartir transferencias"**, below "Quién le transfiere a quién", shares only the **transfers** image (all its pages). It is hidden when there are no transfers.
  2. **"Compartir aportes"**, below the balances, shares only the **contributions** image (all its pages): what each person put in and their balance ("Recibe" / "Pone" / "Está al día"), with the total, the share per person and the "Redondeado para arriba…" line in the header.
- Each button has its own inline status ("Listo, compartido.", "Listo, descargado.", "No se pudo compartir. Probá de nuevo."). Cancelling the share sheet shows nothing.
- Both images use the pizarra style (chalk on charcoal, Bitter numerals). Each carries today's date in es-AR in its header. Every image, and every page of a paginated set, ends with the mandatory footer "powered by fjbalsamo", centered and in the muted chalk color. They are rendered at a fixed 1080 px width, so they look the same and stay sharp on any phone.
- Lists longer than 12 rows are split into numbered pages ("1/2", "2/2"). Nothing is ever cut off.
- Both images are built in advance whenever the results change, so each tap shares immediately. Without file sharing (e.g. most desktop browsers), each button downloads its pages instead, paced so that no page is lost.
- **BREAKING (UX):** "Compartir cuentas" is removed. Text sharing moves to a quiet secondary action, "Compartir como texto", with its own status. It keeps today's text, clipboard fallback and messages.
- Fully client-side, with no new dependencies: images are drawn directly on `<canvas>`.

## Capabilities

### New Capabilities
- `share-images`: building the transfers and contributions images (content, pagination, date, footer, rendering) and sharing each from its own button as files, with a paced download fallback and per-button feedback.

### Modified Capabilities
- `share-summary`: plain-text sharing is triggered by "Compartir como texto" (end of the settlement section, own status) instead of "Compartir cuentas". The text format, clipboard fallback and messages are unchanged.
- `app-shell`: the settlement section places "Compartir transferencias" below the transfers, and "Compartir aportes" and then "Compartir como texto" below the balances.

## Impact

- New code under `src/features/settlements` (image page model, canvas renderer, share-images button) and a new hook `src/hooks/useShareImages.ts`. `App.tsx` wires the second hook, and `ShareButton` is split into the image button and a text link.
- No new runtime dependencies. Bundle growth is limited to our own drawing code.
- `openspec/config.yaml` MVP feature line for "Compartir cuentas" gets updated to mention images (done during apply).
- Manual checks are needed on a real iPhone (iOS Safari) and Android (Chrome) for file sharing into WhatsApp.

## Out of scope

- Server-side rendering, image hosting, short links or any paid or third-party service.
- Sharing both images in one tap, editing or theming the images, or custom pages.
- Sharing a link to the live asado, QR codes, or multi-device sync.
- Any other footer text, branding or app URL on the images (the footer is fixed to "powered by fjbalsamo").
- PDF or other export formats.
