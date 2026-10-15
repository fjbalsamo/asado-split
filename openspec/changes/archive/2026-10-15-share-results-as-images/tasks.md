# Tasks

Every task is done only when `yarn lint && yarn test` passes. Pure logic follows TDD: write the failing Vitest test first. GUI is fully modular: one component per file, no multi-component `.tsx` files. Write ` ` escapes in test files and verify none became literal NBSPs.

## 1. Image page model (pure)

- [x] 1.1 TDD `src/features/settlements/images/formatImageDate.ts`: long es-AR date from an injected `today` ("15 de octubre de 2026"); verify tests pass (spec share-images: transfers/contributions image content)
- [x] 1.2 TDD `src/features/settlements/images/buildImagePages.ts` (`ImagePage` type, transfers pages): header lines, the reference asado's 8 rows as exact strings in order, "Nadie le debe nada a nadie." for one participant and for equal contributions, footer "powered by fjbalsamo", file names; verify tests pass (spec share-images: transfers image content)
- [x] 1.3 Extend `buildImagePages` with contributions pages: the "Total … · Le toca a cada uno …" header, the rounding line only when there is a surplus (reference, non-divisible and no-surplus cases), rows "Puso …" with "Recibe/Pone/Está al día" (zero-total case); verify tests pass (spec share-images: contributions image content)
- [x] 1.4 TDD pagination: at most 12 rows per page, labels "1/2" only when there are several pages, 12 vs 13 vs 15 participants, file names per page, share order (all transfers pages, then contributions pages); verify tests pass (spec share-images: long lists)
- [x] 1.5 TDD `truncateToWidth(text, maxWidth, measure)` with a fake measure: fits unchanged, long names end with "…", never wider than `maxWidth`; verify tests pass (spec share-images: long name)
- [x] 1.6 TDD the mandatory footer on the page model: for the reference asado and for 15 participants (paginated contributions), **every** page has `footer === "powered by fjbalsamo"` (exact, lowercase), and no page carries "AsadoSplit"; verify tests pass (spec share-images: every image carries the footer)

## 2. Canvas renderer

- [x] 2.1 TDD `src/features/settlements/images/renderPage.ts` against a fake 2D context (records `fillText`, `fillRect`, `font`, `scale`): canvas width 1080 with scale 3 for any `devicePixelRatio`, pizarra background, Bitter for headings and amounts, every header, row and empty-message string drawn, the footer "powered by fjbalsamo" drawn centered (`textAlign` center at x = 540) in `chalkMuted` on every page rendered, nothing drawn past the right edge; verify tests pass (spec share-images: sharp, consistent and on-brand)
- [x] 2.2 Add `loadImageFonts()` (awaits `document.fonts.load('700 20px Bitter')` and `document.fonts.ready`) and `pageToFile(page)` (`toBlob` → `File` with the page's file name and `image/png`); test with a stubbed `document.fonts` and canvas `toBlob`; verify tests pass (design D3)

## 3. Sharing hook

- [x] 3.1 TDD `src/hooks/useShareImages.ts` (injected renderer, stubbed `navigator.share`/`canShare`, fake timers): pre-builds files 300 ms after `pages` change; stale builds never win; status `shared` with files in order; `AbortError` (including a real `DOMException`) → `idle`; other errors → `error`; resets to `idle` after 4 s; timer cleared on unmount; verify tests pass (spec share-images: shares the result images, images are ready when the user taps)
- [x] 3.2 TDD the download fallback in `useShareImages`: no `navigator.share` or `canShare({ files })` false → one `<a download>` per file in order with the right names, object URLs revoked, status `downloaded`; tapping before files are ready builds then shares or downloads; verify tests pass (spec share-images: download fallback)

## 4. UI

- [x] 4.1 Replace `ShareButton.tsx` with `ShareImagesButton.tsx` ("Compartir cuentas", contained, full width), `ShareTextButton.tsx` ("Compartir como texto", text button) and `ShareStatusMessage.tsx` (one polite live region: the image status when not idle, otherwise the text status; messages "Listo, compartido.", "Listo, descargamos las imágenes.", "Copiado. Pegalo en el grupo.", "No se pudo compartir. Probá de nuevo."); update the settlements barrel; RTL tests for each; verify tests pass (specs share-images, share-summary)
- [x] 4.2 Wire `App.tsx`: `pages` via `useMemo(buildImagePages(...))`, `useShareImages(pages)` alongside `useShareSummary`, both actions hidden with no participants; update `App.wiring.test.tsx` and `App.test.tsx` ("Compartir como texto" for the text flow, a mocked file share for the images); verify `yarn build` succeeds (specs share-images, share-summary)

## 5. Docs and manual checks

- [x] 5.1 Update `README.md` (feature list, known limitations: image sharing needs file-share support, otherwise images are downloaded) and the "Compartir cuentas" line of `openspec/config.yaml` to mention images; verify `openspec validate share-results-as-images --strict` passes
- [x] 5.4 Fix the download fallback (review: only the contributions image arrived). Downloads must be sequential with `DOWNLOAD_GAP_MS` between files and a deferred revoke (`REVOKE_DELAY_MS`). Tests with fake timers: both files are clicked in order, transfers first; no URL is revoked before the last click; 4 pages download in order for 15 participants. The page label is drawn right after the title. Verify `yarn lint && yarn test` (spec share-images: download fallback, long lists)
- [x] 5.5 Test the real share payloads (pages from `buildImagePages`, not stubs): the transfers button shares only `asado-transferencias-*.png` in page order and the contributions button only `asado-aportes-*.png`, both in `navigator.share` and in the download fallback; verify tests pass (spec share-images: per-button sharing)
- [x] 5.2 Manual check on a real iPhone (iOS Safari) and an Android phone (Chrome): the share sheet shows 2 images in order, WhatsApp receives them, 15+ participants produce numbered pages, text is sharp and long names are shortened; desktop downloads both files. Record the results in this task
  - Results (reported by the user, recorded as-is): iPhone (iOS Safari) OK — "Compartir transferencias" and "Compartir aportes" each share only their own image to WhatsApp.
  - Not tested: Android (Chrome), pagination with 15+ participants on a real device, and desktop downloads. Marked done at the user's request with these gaps open.
- [x] 5.3 Final gate: `yarn lint && yarn test && yarn build`, every new `.tsx` has one component and is under ~120 lines, no literal NBSPs in `src`

## 6. Two share buttons (review change)

Replaces the single "Compartir cuentas" button (design D5).

- [x] 6.1 TDD `buildImagePages`: no transfers page when there are no transfers (one participant, equal contributions, zero total), with only the contributions page left; update the transfers tests; verify tests pass (spec share-images: transfers image content)
- [x] 6.2 Replace `ShareImagesButton` and `ShareStatusMessage` with `ShareImageButton.tsx` (label, status and onShare props; outlined; own polite live region with "Listo, compartido.", "Listo, descargado." and "No se pudo compartir. Probá de nuevo."). Give `ShareTextButton.tsx` its own live region ("Listo, compartido.", "Copiado. Pegalo en el grupo.", error). Update the barrel; RTL tests for each; verify tests pass (specs share-images, share-summary)
- [x] 6.3 Wire `App.tsx`: split pages by kind, `useShareImages` once per kind, "Compartir transferencias" right below `TransferList` (only with transfers), "Compartir aportes" right below `BalanceList`, then "Compartir como texto"; update `App.wiring.test.tsx` (order on screen, hidden rules, each button shares only its own files, independent statuses); verify `yarn build` succeeds (specs share-images, app-shell)
- [x] 6.4 Update `README.md` and the `openspec/config.yaml` feature line to describe the two image buttons and the text link; verify `openspec validate share-results-as-images --strict`
- [x] 6.5 Final gate: `yarn lint && yarn test && yarn build`, one component per new `.tsx` file and each under ~120 lines, no literal NBSPs in `src`
