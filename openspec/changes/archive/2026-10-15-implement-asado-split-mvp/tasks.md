# Tasks

Every task is done only when `yarn lint && yarn test` passes. Domain tasks follow TDD: write the failing Vitest test first. GUI is fully modular: one component per file, no multi-component `.tsx` files.

## 1. Tooling

- [x] 1.1 Add dev deps `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `prettier`, `eslint-config-prettier` with yarn; add scripts `test` (`vitest run`), `test:watch`, `format`; add `"packageManager": "yarn@1.22.22"` to `package.json`; verify `yarn test --passWithNoTests` exits 0 (design D12)
- [x] 1.2 Configure Vitest in `vite.config.ts` (jsdom, `src/test/setup.ts` with jest-dom) and set `base: './'`; verify `yarn build` succeeds and `dist/index.html` references assets with `./` (design D12)
- [x] 1.3 Add `"strict": true` to `tsconfig.app.json`, add `.prettierrc` and wire `eslint-config-prettier`; verify `yarn lint` and `tsc -b` pass on the template code (design D12)

## 2. Domain: models and money

- [x] 2.1 Create `src/domain/models/{participant,balance,transfer}.ts` (types only) and `src/domain/errors.ts` (`DomainError`); verify `tsc -b` passes
- [x] 2.2 TDD `src/domain/services/money.ts` `parseMoney`: tests for every accepted shape (`42000`, `0,29`, `180.000`, `$ 15.000,5`, `1500.75`, `1500,75`, `1.500,75`, `$\u00A01.500,75` with NBSP as produced by `formatMoney`, empty → 0) and every error code (`mucho`, `1.5000` → format; `-500` → negative; `10,999` → decimals; `100000000,01` → max; `100.000.000` OK); verify tests pass (spec money: notation, invalid amounts)
- [x] 2.3 TDD `formatMoney`: `15088888` → `$ 150.888,88`, `0` → `$ 0,00`, `1` → `$ 0,01` (NBSP after `$`); round trip `parseMoney(formatMoney(x)) === x` for a seeded loop of values up to the max; verify tests pass (spec money: display, formatted value accepted back)

## 3. Domain: participants, shares, balances, settlement

- [x] 3.1 Create the reference fixture `src/domain/fixtures/referenceAsado.ts` (Franco 18000000, Pica 4200000, El Aleman 4000000, then Tito, Leo, Mole, El Negro, El Pelado, Bucky at 0, fixed ids) plus its expected shares, balances and transfers from the specs; verify it type-checks (config rule: reference asado)
- [x] 3.2 TDD `src/domain/services/participants.ts` (`normalizeName`, `isNameTaken`, `addParticipant`, `updateParticipant` keeps position, `removeParticipant`; readonly inputs; typed `{ ok: false, error }` result, never a throw, on empty/long/duplicate name, empty/duplicate id or invalid contribution; unknown id → `ok: true`, same list); verify tests pass (spec participant-management: names, edit keeps order, remove)
- [x] 3.3 TDD `src/domain/services/shares.ts` (`computeTotal`, `computeShares`, `summarizeShare`): reference fixture, `1001`/3 → 334,334,333, Zoe/Ana `101` → 51/50, divisible, zero total, one participant, no participants; seeded-loop invariant test Σ shares = total and max − min ≤ 1; verify tests pass (spec expense-split: total, equal shares)
- [x] 3.4 TDD `src/domain/services/balances.ts`: reference fixture balances, equal contributions, one participant, `1000`/3 case; invariant Σ = 0; verify tests pass (spec expense-split: balances)
- [x] 3.5 TDD `src/domain/services/settlement.ts` greedy two-pointer: reference fixture exact transfers and order, `1000`/3 case, A/B/C/D case, empty cases, determinism, seeded-loop invariants (amount > 0, no self-transfer, all balances settled, count ≤ payers + receivers − 1), throws on non-zero sum; verify tests pass (spec settlement)
- [x] 3.6 Verify `src/domain` imports nothing from React, MUI, Formik or Yup (`grep -r "from '\(react\|@mui\|formik\|yup\)" src/domain` returns nothing) (design goals)

## 4. Persistence

- [x] 4.1 TDD `src/lib/storage.ts` (`loadAsado` → `{ participants, status: 'none' | 'restored' | 'discarded' }`, `saveParticipants`, schema `{ version: 1, participants }`, key `asado-split`) with an in-memory storage fake: round trip keeps order; status `none` for a missing key or throwing storage, `restored` for valid data, `discarded` + `[]` for `{not json`, version 99, missing version, non-array, fractional/negative contribution, empty name, duplicate id/name; saving `[]` removes the key; save/load swallow storage exceptions; verify tests pass (spec asado-persistence: persist, invalid data)
- [x] 4.2 Add `src/lib/id.ts` (`createId` with `crypto.randomUUID` and fallback) with a test that two ids differ; verify tests pass (design risks)

## 5. Hooks

- [x] 5.1 TDD `src/hooks/useAsado.ts` with `renderHook`: readonly arrays in `UseAsadoResult`; invalid add/update that bypasses the form (duplicate name, rename to existing, negative contribution) leaves state unchanged and does not throw; lazy init from injected storage; `restoreFailed` true only for discarded data, cleared by `dismissRestoreNotice` and by `addParticipant`; a suite without injected deps on jsdom's real `localStorage` (load, persist, corrupted key → empty + `restoreFailed` + key removed); add/update/remove/reset update state and derived `total`, `shares`, `shareRange`, `balances`, `transfers` (reference fixture); action identities stable across renders; saves on change; `resetAsado` empties the list, clears storage and sets `canUndoReset`; `undoReset` restores the exact list (ids, order) and saves it; `dismissUndo` drops the snapshot; `addParticipant` after a reset drops the snapshot; contains no arithmetic (delegates to domain); verify tests pass (specs participant-management, asado-persistence, expense-split)
- [x] 5.2 TDD `src/hooks/useShareSummary.ts` with stubbed `navigator.share`/`navigator.clipboard` and fake timers: shared, AbortError → idle (also as a real `DOMException`, and clearing a previous `copied` message, never `error`), share error → clipboard → copied, no share → copied, both fail → error, resets to idle after 4 s, timer cleared on unmount; verify tests pass (spec share-summary: native/fallback)

## 6. Share text

- [x] 6.1 TDD `src/features/settlements/lib/buildShareText.ts`: exact reference-asado text, equal-contributions text, one-participant total line; verify tests pass (spec share-summary: share text)

## 7. GUI foundation

- [x] 7.1 Add deps `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `formik`, `yup`, `@fontsource/bitter` (import only `latin-700.css`); verify install and `yarn build` succeed
- [x] 7.2 Create `src/theme/index.ts` (palette, Bitter display type, `textTransform: 'none'`, no shadows, 48 px minimum targets, `:focus-visible` ring) and check every palette text/background pair against WCAG AA with a small unit test on contrast ratios; verify test passes (spec app-shell: accessible; design D11)
- [x] 7.3 Rewrite `src/main.tsx` with `ThemeProvider` + `CssBaseline` + font import; delete `App.css`, `index.css`, `src/assets/*` and template-only `public/icons.svg`; verify `yarn build` succeeds
- [x] 7.4 Create `src/components/AppHeader.tsx`, `Section.tsx`, `EmptyState.tsx` (one component per file) with an RTL test that `Section` renders a labelled `<section>`; verify tests pass (spec app-shell: single page)
- [x] 7.5 Create `src/components/MoneyField.tsx` (Formik `useField`, `inputMode="decimal"`, no `$` adornment, blur reformat) with an RTL test inside a Formik wrapper: on blur `1.500` → `$ 1.500,00`, `1500.75` / `1500,75` / `1.500,75` → `$ 1.500,75`, empty stays empty, `1.5000` stays as typed with the format message; verify tests pass (spec money: blur reformat; design D7)

## 8. GUI: participants feature

- [x] 8.1 TDD `features/participants/schemas/participantSchema.ts` (`createParticipantSchema(participants, exceptId?)`): every es-AR name and contribution message from the specs, own name allowed when editing; the duplicate check uses the current `participants` list (design D13); verify tests pass (spec participant-management: names, contribution)
- [x] 8.2 Create `ParticipantForm.tsx` (Formik, contribution via `MoneyField`, Enter submits, clears and refocuses name) with an RTL test: adding Franco 180000 calls `onAdd({ name: 'Franco', contribution: 18000000 })`, empty contribution → 0, invalid input shows the message and does not call `onAdd`; verify tests pass (spec participant-management: add)
- [x] 8.3 Create `ParticipantItem.tsx` and `ParticipantEditForm.tsx` with RTL tests: buttons named "Editar a Pica"/"Sacar a Pica"; edit form prefills the contribution as `$ 42.000,00`; edit saves parsed values; "Cancelar" discards; renaming to "franco" shows "Ya hay alguien que se llama así."; verify tests pass (spec participant-management: edit, remove)
- [x] 8.4 Create `ParticipantList.tsx` (owns `editingId`, one row in edit mode at a time, shows `EmptyState` with "Todavía no hay nadie. Agregá a alguien para arrancar.") and `features/participants/index.ts` barrel; RTL test for single edit mode and empty state; verify tests pass (spec app-shell: empty states)
- [x] 8.5 Create `RestoreNotice.tsx` (MUI `Alert`, `role="status"`, text "No pudimos recuperar el asado guardado. Empezamos uno nuevo.", close button "Cerrar aviso" → `onClose`) with an RTL test for text, role and close; verify tests pass (spec asado-persistence: recovery message)

## 9. GUI: expenses and settlements features

- [x] 9.1 Create `features/expenses/components/SummaryRow.tsx` and `SummaryCard.tsx` (pizarra) + barrel; RTL test: reference fixture shows "$ 262.000,00", "9 personas", "$ 29.111,11 o $ 29.111,12"; one participant shows "1 persona"; verify tests pass (spec app-shell: summary)
- [x] 9.2 Create `TransferItem.tsx`, `TransferList.tsx` ("Nadie le debe nada a nadie." when empty), `BalanceItem.tsx`, `BalanceList.tsx` ("Recibe"/"Pone"/"Está al día"); RTL test with the reference fixture ("Tito le transfiere $ 29.111,11 a Franco", "Recibe $ 150.888,88", "Pone $ 29.111,11"); verify tests pass (spec app-shell: settlement section)
- [x] 9.3 Create `ShareButton.tsx` (status text in `role="status"`) and `ResetButton.tsx` (one tap calls `onReset`); RTL tests for each status message and for the reset call; verify tests pass (spec share-summary; spec asado-persistence: start a new asado)
- [x] 9.4 Create `UndoResetSnackbar.tsx` (MUI `Snackbar`, "Asado borrado", action "Deshacer", `autoHideDuration` 6000 → `onDismiss`, ignores `clickaway`) + `features/settlements/index.ts` barrel; RTL tests with fake timers: "Deshacer" calls `onUndo`; after 6 s `onDismiss` is called; a click outside does not call `onDismiss`; verify tests pass (spec asado-persistence: undo, times out, tapping elsewhere)

## 10. App integration

- [x] 10.1 Rewrite `src/App.tsx` composing sections in spec order from barrels only; only `App` uses `useAsado`/`useShareSummary`; `UndoResetSnackbar` open while `canUndoReset`; `RestoreNotice` shown while `restoreFailed`; summary/settlement/share/reset hidden with no participants; verify `yarn build` succeeds (spec app-shell: single page)
- [x] 10.2 Add `src/App.test.tsx` integration test (lean scope, approved in review): enter the reference asado via the form, assert summary and the eight transfers in order, then reset and "Deshacer" restores the 9 participants and 8 transfers. Empty state, one participant, storage load, recovery message and reset/undo basics are covered by `src/App.wiring.test.tsx`; edit/remove/timeout/add-after-reset by the component and hook tests; verify tests pass (specs participant-management, asado-persistence, app-shell)
- [x] 10.3 Check modularity: every `.tsx` under `src/` exports exactly one component and is under ~120 lines (`wc -l` + review); split any that exceed; verify `yarn lint && yarn test && yarn build` pass (config rule: GUI fully modular)
- [x] 10.4 Manual check in `yarn dev` at 360 px and 1280 px: single column, no horizontal scroll, visible focus on Tab, decimal keypad on amounts, "Asado borrado" snackbar fully visible above the bottom edge; record results in the change's notes (spec app-shell: layout, accessibility) — Marked done at the user's request: the user confirmed the manual check; no detailed results were recorded.
- [x] 10.5 Replace the template `README.md` with a short project description and scripts (`dev`, `test`, `lint`, `build`); verify the documented commands run as written

## 11. GitHub Pages workflow

Creating the file is in scope. Creating the remote repo, pushing, enabling Pages or triggering a deploy is **not** and needs explicit authorization.

- [x] 11.1 Create `.github/workflows/deploy.yml`: on `push` to `main` + `workflow_dispatch`; `build` job (checkout, setup-node LTS with `cache: yarn`, `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`, `yarn build`, `configure-pages`, `upload-pages-artifact` with `path: dist`); `deploy` job (`needs: build`, `environment: github-pages`, `deploy-pages`); permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`. Verify the YAML parses and the same four commands pass locally in a clean install (`rm -rf node_modules && yarn install --frozen-lockfile && yarn lint && yarn test && yarn build`) (design D12)
- [x] 11.2 Add a "Deploy" section to `README.md` with the manual one-time steps (create public repo, push `main`, Settings → Pages → Source: GitHub Actions) and the expected URL `https://<user>.github.io/asado-split/`; verify `yarn build && yarn preview` serves the app from relative asset paths (design D12)

## 12. Whole-peso rounding (review change)

Supersedes the centavo/decimal values cited in tasks 2.2, 2.3, 3.1, 3.3–3.5, 6.1, 7.5, 8.1–8.3, 9.1, 9.2 and 10.2. Amounts are whole pesos held as integer centavos; share = ceil(total / n) pesos; surplus to the top contributor (design D1, D3, D4).

- [x] 12.1 TDD `money.ts`: `parseMoney` accepts whole pesos only (`decimals` for any comma part or dot + 1–2 digits), `formatMoney` without decimals (`$ 150.896`, `$ 0`, `$ 8`), round trip on whole-peso values; verify tests pass (spec money)
- [x] 12.2 TDD participants invariant: contribution must be a multiple of 100 (`invalid-contribution`), so storage discards centavo data; verify tests pass (specs participant-management, asado-persistence)
- [x] 12.3 TDD `split.ts` (`computeTotal`, `computeSplit` → `{ share, surplus, surplusRecipientId }`) replacing `shares.ts` and `Share`/`ShareRange`; balances add the surplus to the recipient; update the reference fixture to the hand-typed values; settlement tests for the new reference transfers, non-divisible and tie cases; seeded-loop invariants (whole pesos, conservation, recipient is first top contributor); verify tests pass (specs expense-split, settlement)
- [x] 12.4 Update `useAsado` to expose `share`, `surplus`, `surplusRecipientId` (no `shares`/`shareRange`); verify hook tests pass
- [x] 12.5 Update `buildShareText` for the single share and the "Redondeado para arriba: sobran $ 8 para Franco." line; exact spec texts; verify tests pass (spec share-summary)
- [x] 12.6 Update schema messages ("Poné el monto sin centavos.", "Ingresá un monto válido, por ejemplo 15000.") and `MoneyField` (`inputMode="numeric"`, blur `$ 1.500`); verify tests pass (spec money, participant-management)
- [x] 12.7 Update `SummaryCard` (single share + optional rounding line), lists and App tests to whole pesos; verify `yarn lint && yarn test && yarn build` and `openspec validate --strict` pass (spec app-shell)
