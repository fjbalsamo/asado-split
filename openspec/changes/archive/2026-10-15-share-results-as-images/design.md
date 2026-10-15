# Design

## Context

See proposal.md (Why) and the specs (`share-images`, modified `share-summary`). Current state:
- `useShareSummary(text)` shares plain text through `navigator.share`, falls back to the clipboard, and exposes `status`.
- `ShareButton` renders "Compartir cuentas" plus a polite live region (replaced by this change).
- `App.tsx` is the only hook consumer.
- Domain values (`participants`, `total`, `share`, `surplus`, `surplusRecipientId`, `balances`, `transfers`) and `formatMoney` already exist, and amounts are whole pesos.
- The bundle is already about 551 kB minified, so this change adds no dependencies.

## Goals / Non-Goals

**Goals:**
- Two image types (transfers, contributions), paginated at 12 rows, identical on every device, drawn without any library.
- Sharing that works with iOS Safari's strict user-activation rules.
- Most logic in pure, jsdom-testable functions; the canvas layer is thin.

**Non-Goals:**
- Pixel-perfect parity with the on-screen pizarra. The images use a dedicated layout in the same style.
- Visual regression tooling (screenshot diffs). Image appearance is checked manually.

## Decisions

### D1. Pipeline: pure page model, then a thin canvas renderer
```
asado values + today
        |
        v
buildImagePages()  (pure)  -->  ImagePage[]   (transfers pages, then contributions pages)
        |                        { kind, fileName, title, pageLabel?, headerLines[],
        |                          rows[{ left, middle?, right }], emptyMessage?, footer: "powered by fjbalsamo" }
        v
renderPage(page, deps)  (canvas)  -->  PNG Blob  -->  File(fileName, 'image/png')
        |
        v
useShareImages(pages of ONE kind)  -->  { status, share }   (one instance per button)
```
- `features/settlements/images/buildImagePages.ts` holds all copy, formatting (`formatMoney`, the `roundingNote` helper, the date) and pagination, so the spec scenarios are asserted on plain data.
- `features/settlements/images/renderPage.ts` only lays out and draws. It receives a canvas factory and a text-measure function, so it can run in jsdom against a fake 2D context.
- *Alternatives rejected* (explored earlier): `html2canvas` (heaviest, re-implements CSS), `html-to-image`/`modern-screenshot` (SVG `foreignObject` is fragile on iOS Safari and depends on the live layout and screen width), and SVG → canvas (Bitter must be embedded as a data URL and Safari is fussy).

### D2. Content and pagination
- **Date:** `new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' })` → "15 de octubre de 2026". `today` is injected for tests.
- **Transfers rows:** `{ left: "Tito → Franco", right: "$ 29.112" }`. With no transfers, **no transfers page is built** (the button is hidden; the on-screen list shows "Nadie le debe nada a nadie.").
- **Contributions header:** "Total {total} · Le toca a cada uno {share}", plus the `roundingNote` line when `surplus > 0`. Rows are `{ left: name, middle: "Puso $ X", right: "Recibe $ Y" | "Pone $ Y" | "Está al día" }`. Specs read them as "name · Puso … · …".
- **Footer:** one constant `IMAGE_FOOTER = "powered by fjbalsamo"` (exact, lowercase), set on **every** page the model produces, including each page of a paginated set. The renderer draws it centered (`textAlign = "center"` at width / 2) in `chalkMuted`, so no page can be built without it.
- **Pages:** `chunk(rows, 12)`. The page label is `"{i}/{n}"` only when `n > 1`. File names are `asado-transferencias-{i}.png` and `asado-aportes-{i}.png`.
- **Order and split:** `buildImagePages` returns all transfers pages, then all contributions pages. `App` splits them by `kind` with `useMemo`, so each button's hook gets a stable array of only its pages.

### D3. Rendering: fixed 1080 px, pizarra style
- **Size:** layout in logical px at width **360**, canvas scaled by **3**, so every image is exactly 1080 px wide whatever the device's `devicePixelRatio` (spec: same width on any phone). Height = header + rows × row height + footer. Twelve rows fit in about 2 100 px, well within canvas limits.
- **Colors:** from `theme/tokens`. The background is `pizarra`, primary text `chalk`, labels and footer `chalkMuted`, and hairline separators are a low-alpha chalk. Every text color is a pair already AA-tested against `pizarra`. There is no green on the dark background: the words "Recibe" and "Pone" carry the meaning, as on screen.
- **Type:** Bitter 700 for "Cuentas del asado", titles and amounts; the system UI stack for names and labels.
- **Font loading:** before the first draw, `await document.fonts.load('700 20px Bitter')` (self-hosted latin-700 already bundled), then `await document.fonts.ready`.
- **Long names:** truncated with "…" via binary search on `measureText` to the column width. Amounts are never truncated.
- **Output:** `canvas.toBlob(cb, 'image/png')` wrapped in a Promise, then `new File([blob], fileName, { type: 'image/png' })`.

### D4. Sharing: pre-built files, then share or download
- **Pre-building:** each `useShareImages(pages)` instance (transfers, contributions) rebuilds the files whenever `pages` changes, debounced by 300 ms. Each build carries a generation counter, so a stale build never replaces a newer one. **Why:** iOS Safari rejects `navigator.share` unless it runs promptly after the tap (transient user activation). Drawing and encoding PNGs inside the tap handler risks a `NotAllowedError`, so files must already exist when the tap happens.
- **On tap:** if the latest files aren't ready yet, build them now (best effort; spec "Images are ready when the user taps"). Then:
  - `navigator.canShare?.({ files })` is true → `navigator.share({ files, title: 'Cuentas del asado' })` → `shared`. An `AbortError` means the user cancelled → `idle` (duck-typed by `name`, as in `useShareSummary`). Any other error → `error`.
  - Otherwise → download each file in order with an object URL and a temporary `<a download>`, **waiting `DOWNLOAD_GAP_MS` (250 ms) between files** and revoking all object URLs only `REVOKE_DELAY_MS` (10 s) after the last click → `downloaded`. Found in review: starting all downloads in the same task and revoking each URL right after its click lets Safari and Firefox keep only the last file, which lost the transfers image.
- **Status (per button):** `'idle' | 'shared' | 'downloaded' | 'error'` → "Listo, compartido.", "Listo, descargado.", "No se pudo compartir. Probá de nuevo.", reset to `idle` after `SHARE_STATUS_RESET_MS` (4 s), timer cleared on unmount. Each hook instance owns its status, so the two buttons never overwrite each other's message.
- **No text with the files.** Some share targets, possibly WhatsApp, drop the caption when files are attached, so text sharing stays a separate action.

### D5. UI: one image button under each list, one quiet text link
```
Quién le transfiere a quién
  Tito le transfiere $ 29.112 a Franco
  ...
[ (icon) Compartir transferencias ]   <- outlined, full width; hidden with no transfers
  <its own polite status>
Cómo quedó cada uno
  Franco            Recibe $ 150.896
  ...
[ (icon) Compartir aportes ]          <- outlined, full width
  <its own polite status>
         Compartir como texto          <- text button, secondary
  <its own polite status>
```
- **Buttons:** decided in review, replacing the single "Compartir cuentas". Each button sits right below the list it shares, so it is obvious what will be sent. With two equal actions, neither is the page's single primary action, so both are `outlined` (ember border and label, AA-tested ember on bone) rather than `contained`.
- **Components:** `ShareImageButton.tsx` (props `label`, `status`, `onShare`; renders the button and its own polite live region) is used twice. `ShareTextButton.tsx` (props `status`, `onShare`) is the quiet text button with its own live region. `ShareImagesButton` and `ShareStatusMessage` are removed. One component per file.
- **Download path:** paced (`DOWNLOAD_GAP_MS` = 250 ms) with a deferred revoke (`REVOKE_DELAY_MS` = 10 s). Found in review: instant downloads with immediate revoke let some browsers keep only the last file.
- `App.tsx` builds `pages` with `useMemo(buildImagePages(...))`, splits them by kind, and calls `useShareImages` twice. It still composes from barrels only, and prop depth stays at 1.

### D6. Testing split
| Layer | How |
|---|---|
| `buildImagePages` | Vitest, node env: every spec scenario as exact strings, pagination at 12/13/15 rows, date with a fixed `today`, file names, order |
| truncation | Vitest with a fake monospace `measure` |
| `renderPage` | jsdom with a fake 2D context that records `fillText`, `fillRect` and `font` calls: canvas width 1080, scale 3, Bitter used for amounts, every row string drawn, no text past the right edge |
| `useShareImages` | `renderHook`, injected renderer, stubbed `navigator.share/canShare` and `URL.createObjectURL`, fake timers: shared, cancel, error, download fallback, stale-build ordering, build-on-tap |
| UI | RTL: each image button with its label and own live region, text link with its own live region, transfers button hidden with no transfers, all hidden with no participants, statuses independent |
| Manual | real iPhone (iOS Safari) and Android (Chrome): share sheet shows 2 images, WhatsApp receives them, pagination with 15+ participants, sharpness |

## Risks / Trade-offs

- [iOS rejects a share if the tap waited on image building] → pre-built files (D4). Residual risk: tapping within the 300 ms debounce right after an edit. That builds on tap, and if iOS refuses it shows the error message, so the user taps again.
- [WhatsApp recompresses images] → 1080 px width (WhatsApp's typical size) and ≤12 rows per page keep text legible.
- [Hand-drawn layout needs more code than a DOM screenshot] → limited to two fixed layouts. Most logic is in the pure, fully tested page model.
- [Names in different scripts or emoji may render with fallback fonts] → acceptable. Names come from the system font stack on the device.
- [Memory with many pages] → PNGs are about 100–300 kB each, and files are rebuilt only when results change.

## Migration Plan

No data migration. The existing text share keeps its behavior under the new label "Compartir como texto". Rollback is reverting the change.

## Open Questions

- None. The footer is fixed to "powered by fjbalsamo" (decided in review; it replaces the earlier "AsadoSplit" footer and the deferred URL).
