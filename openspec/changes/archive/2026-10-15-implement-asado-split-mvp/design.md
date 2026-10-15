# Design

## Context

See proposal.md (Why) and the capability specs for required behavior. Current state: a bare Vite 8 + React 19 + TypeScript template (yarn). It has no `strict` flag, no test runner, no MUI/Formik/Yup, and no Prettier. There are no existing specs.

## Goals / Non-Goals

**Goals:**
- Business logic only in `src/domain` (pure TS, no React/MUI/Yup/Formik imports), unit-tested with Vitest using TDD.
- A thin hook layer that only wires state, persistence and memoized domain calls.
- A fully modular GUI: **one React component per `.tsx` file**, no multi-component files, files under ~120 lines.
- Deterministic results: same input → same shares, balances, transfers and share text.

**Non-Goals:**
- Minimizing the number of transfers (greedy is good enough and is never claimed optimal).
- React Context or a state library (prop depth stays ≤ 2; see D9).
- Component visual-regression testing.

## Decisions

### D1. Money: whole pesos held as integer centavos, es-AR parsing (`domain/services/money.ts`)
- **Unit:** amounts stay integer **centavos** internally, as config.yaml requires, but every amount is a **whole number of pesos**, so every value is a multiple of 100. This was decided in review over switching to integer pesos, because it keeps config.yaml's money rule and storage `version: 1` unchanged.
- `parseMoney(input: string): MoneyParseResult` returns `{ ok: true, value }` or `{ ok: false, error: 'format' | 'negative' | 'decimals' | 'max' }`. Steps: remove all whitespace (`\s`, which includes the NBSP that `formatMoney` emits), then strip a leading `$`. Its own formatted output therefore parses back. Empty → `0`. A leading `-` → `negative`. Then:
  - `^\d+$` or `^\d{1,3}(\.\d{3})+$`: whole pesos, with optional thousands groups → `pesos × 100`;
  - a whole-peso value followed by a zero-centavos suffix (`,0`, `,00`, `.0`, `.00`, e.g. `1.500,00` or `1500.00`) → accepted, suffix ignored;
  - any other comma part (`1500,50`, `1.500,05`) or a single dot followed by 1–2 digits (`1500.75`) → `decimals`, whose message is "Poné el monto sin centavos.";
  - any other shape → `format` (e.g. `1.5000`, `1,2,3`, letters).
- `MAX_CONTRIBUTION = 10_000_000_000` centavos (100 M pesos). Larger → `max`. At this cap, even 1 000 participants stay far below `Number.MAX_SAFE_INTEGER`.
- `formatMoney(centavos)` uses one module-level `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 })` and passes it an exact integer-pesos string: `$ 29.112`, `$ 0`. Division by 100 happens only at this display boundary. The same string is used as the amount field's value after blur and as the edit form's initial value.
- Error messages are **not** in the domain. Yup maps error codes → es-AR strings (D7).
- *Alternative rejected*: parsing with `Number()` after replacing separators, because of float rounding and silent acceptance of decimals.

### D2. Participants rules (`domain/services/participants.ts`)
The expected structure did not list this file, but the "no business logic in hooks" rule requires it: pure helpers `normalizeName`, `isNameTaken(participants, name, exceptId?)` (trim + `toLocaleLowerCase('es-AR')`), and list operations `addParticipant(list, participant)`, `updateParticipant(list, id, patch)`, `removeParticipant(list, id)`. They enforce invariants (non-empty, ≤ 40 chars, unique name, unique non-empty id, safe integer ≥ 0 and a multiple of 100, i.e. whole pesos) and **return a typed result instead of throwing**: `{ ok: true; participants } | { ok: false; error: ParticipantErrorCode }`, with codes `'empty-name' | 'name-too-long' | 'duplicate-name' | 'empty-id' | 'duplicate-id' | 'invalid-contribution'`. Unknown ids are not errors: they return `ok: true` with the same list. `DomainError` remains only in `settle`, for unbalanced input, which no state update can produce. Inputs are `readonly Participant[]`. Keeping this here keeps `useAsado` free of business logic. IDs come from `crypto.randomUUID()` in `src/lib/id.ts`, injected by the hook so the domain stays deterministic in tests.

### D3. Split: share rounded up to whole pesos, surplus to the top contributor (`domain/services/split.ts`)
- `computeTotal(participants)` = sum of contributions.
- `computeSplit(participants)` → `SplitSummary { share, surplus, surplusRecipientId }`. Replaces the earlier per-participant `Share[]`, `ShareRange` and `summarizeShare`, because all shares are now equal.
  - `n = 0` → `{ share: 0, surplus: 0, surplusRecipientId: null }`.
  - Integer-only arithmetic: `pesos = total / 100` (exact, since every contribution is whole pesos), then `sharePesos = floor(pesos / n) + (pesos % n === 0 ? 0 : 1)`, i.e. `ceil(total / n)` in whole pesos. `share = sharePesos × 100`.
  - `surplus = n × share − total`, in `[0, (n − 1) × 100]`.
  - `surplusRecipientId`: when `surplus > 0`, the participant with the highest contribution, ties by **insertion order** (first wins); otherwise `null`.
- **Invariants** (tested over a seeded loop of generated whole-peso inputs, no extra dependency): `share` is a multiple of 100; `n × share − surplus = total`; `0 ≤ surplus ≤ (n − 1) × 100`; the recipient's contribution is the maximum, and no earlier participant has the same contribution.
- *Why round up and give the surplus to the top contributor:* everyone pays the same round number, which is easy to transfer. The few extra pesos go to whoever put in the most, who is almost always the person receiving money anyway. *Alternative rejected:* the earlier exact-centavo split with remainder centavos by insertion order, replaced in review in favour of whole pesos.

### D4. Balances (`domain/services/balances.ts`)
`computeBalances(participants)` → `Balance[]` = `contribution − share`, plus `surplus` for the surplus recipient, per participant in insertion order. **Invariant**: `Σ balances = Σ contributions − n × share + surplus = 0`. Money is conserved explicitly and checked in tests, including on random inputs.

### D5. Settlement: greedy two-pointer (`domain/services/settlement.ts`)
```
payers    = balances < 0 → { id, owed: −amount, index }  sorted by owed desc, then index asc
receivers = balances > 0 → { id, due: amount, index }   sorted by due desc,  then index asc
i = j = 0
while i < payers.length and j < receivers.length:
  x = min(payers[i].owed, receivers[j].due)
  emit { from: payers[i].id, to: receivers[j].id, amount: x }
  payers[i].owed −= x; receivers[j].due −= x
  if payers[i].owed == 0: i++
  if receivers[j].due == 0: j++
```
- **Determinism**: the sort is total (amount, then insertion index), so output order is fully defined. Lists are sorted once, not re-sorted per step; the reference-fixture expectations in the spec depend on this.
- **Complexity**: O(n log n) for sorting + O(n) loop; at most `payers + receivers − 1` transfers since every step settles at least one side.
- **Invariants** (tested): every amount > 0 and a safe integer; no self-transfer; applying transfers zeroes every balance; Σ transfers = Σ positive balances.
- Not minimal: the minimum-transfers problem is NP-hard in general. Greedy is documented as "reduces" transfers only.
- Throws `DomainError` if `Σ balances ≠ 0` (guards against misuse).

### D6. Persistence (`src/lib/storage.ts`)
- Key `asado-split`. Value:
  ```json
  { "version": 1, "participants": [{ "id": "uuid", "name": "Franco", "contribution": 18000000 }] }
  ```
- `loadAsado(storage = safe localStorage): { participants: Participant[]; status: 'none' | 'restored' | 'discarded' }`. `none` means nothing is stored, or storage can't be read; it is silent. `restored` means valid data was loaded. `discarded` means data existed but was invalid, and drives the recovery message (D8, D10). Every failure path yields `participants: []`. Discard causes: `null`, `JSON.parse` throwing, a non-object, `version !== 1`, `participants` not an array, any entry with a non-string/empty id, a name failing domain rules, a non-safe-integer or negative contribution, or duplicate id/name. Validation is hand-written type guards that reuse domain invariants (no schema library in `lib`).
- `saveParticipants(list)` writes the versioned value, or removes the key when `list` is empty (reset). It swallows exceptions (quota, private mode).
- Recovery strategy: invalid data is ignored on load and **removed** by the first save effect (an empty list removes the key), so the user is told once ("No pudimos recuperar el asado guardado. Empezamos uno nuevo.") and never again on reload. Only `participants` are stored, never derived values. A future `version: 2` adds a migration function keyed by version. Unknown versions are discarded rather than guessed.

### D7. Forms: Formik + Yup (`features/participants/schemas/participantSchema.ts`)
One schema factory used by both the add form and the inline edit form:
```ts
createParticipantSchema(participants: Participant[], exceptId?: string)
  name:         string().trim()
                  .required('Ingresá un nombre.')
                  .max(40, 'Usá hasta 40 caracteres.')
                  .test('unique', 'Ya hay alguien que se llama así.', v => !isNameTaken(participants, v, exceptId))
  contribution: string()            // raw text, empty allowed
                  .test(…parseMoney… → maps 'format' | 'negative' | 'decimals' | 'max' to the exact es-AR strings in the money spec)
```
Form values are strings. On submit, `parseMoney` produces centavos and `normalizeName` the name before calling `onAdd`/`onSave`. Mapping to domain invariants: required/max/unique ↔ D2 name rules; contribution test ↔ D1 + `contribution ≥ 0`, safe integer. Validation is on blur and submit (`validateOnChange` after first submit) to avoid shouting while typing.

**Blur reformat:** both forms render amounts through one shared `src/components/MoneyField.tsx` (a `TextField` bound with Formik's `useField`). Its `onBlur` runs Formik's blur handler and then `parseMoney(raw)`. When the result is `ok` and `raw` is non-empty, it calls `setValue(formatMoney(value))`. An empty field stays empty. An invalid value stays as typed so the user can fix it next to the inline message. The `$` therefore lives in the value, so the field has **no** `$` `InputAdornment` (it would show twice). Whole pesos only (D1): `1500` and `1.500` → `$ 1.500`; any centavos (`1500,50`, `1500.75`) stay as typed with "Poné el monto sin centavos.".

### D8. Hooks
- `useAsado(deps = { storage, createId })`:
  - One `useReducer` state `{ participants, undoSnapshot, restoreFailed }`, lazily initialised from `loadAsado(storage)`. `restoreFailed = status === 'discarded'`. Deps are read once on mount so callbacks stay stable.
  - Actions (`useCallback`, dispatch only): `addParticipant(draft)`, `updateParticipant(id, draft)`, `removeParticipant(id)`, `resetAsado()`, `undoReset()`, `dismissUndo()`. The participant actions delegate to D2 list functions.
  - **Undo:** a second state `undoSnapshot: Participant[] | null`. `resetAsado` stores the current list in `undoSnapshot` and sets participants to `[]`. `undoReset` restores the snapshot (same ids/order) and clears it. `dismissUndo` clears it without restoring (snackbar timeout). `addParticipant` also clears it (and `restoreFailed`), so an undo can never overwrite newer data. Exposed as `canUndoReset = undoSnapshot !== null`. The snapshot lives only in memory and is never persisted.
  - Derived (`useMemo` on `participants`): `total`, `share`, `surplus`, `surplusRecipientId`, `balances`, `transfers`.
  - `useEffect` → `saveParticipants(participants)` on change. An empty list removes the key, so a reset clears storage, and an undo writes the restored list back.
  - **Recovery notice:** `restoreFailed: boolean` and `dismissRestoreNotice()`. Cleared by `dismissRestoreNotice` or by `addParticipant`.
  - Returns `{ participants, total, share, surplus, surplusRecipientId, balances, transfers, canUndoReset, restoreFailed, addParticipant, updateParticipant, removeParticipant, resetAsado, undoReset, dismissUndo, dismissRestoreNotice }`.
- `useShareSummary(text)` → `{ status: 'idle' | 'shared' | 'copied' | 'error', share }`. `share` tries `navigator.share({ text })` when present. An `AbortError` → stay `idle`. Any other error, or no API → `navigator.clipboard.writeText(text)` → `copied`, else `error`. Status resets to `idle` after 4 s (timer cleared on unmount and on re-share).
- Tests with `renderHook` + `act`; storage injected (in-memory fake) plus one suite without injected deps against jsdom's real `localStorage`; navigator APIs stubbed with `vi.stubGlobal`, timers with `vi.useFakeTimers`.

### D9. GUI composition: one component per file
```
App.tsx               ← only consumer of useAsado + useShareSummary; builds share text via useMemo(buildShareText)
├─ components/AppHeader          (title + one-line voseo subtitle)
├─ components/Section            (heading + children; semantic <section aria-labelledby>)
├─ components/MoneyField         (shared amount TextField: Formik useField, inputMode="numeric", blur reformat; D7)
├─ features/participants
│   ├─ ParticipantForm           props: participants, onAdd
│   ├─ RestoreNotice             props: onClose (shown by App while restoreFailed)
│   ├─ ParticipantList           props: participants, onUpdate, onRemove; owns local editingId
│   │   ├─ ParticipantItem       props: participant, onEdit, onRemove   (read mode)
│   │   └─ ParticipantEditForm   props: participant, participants, onSave, onCancel
│   └─ components/EmptyState     (shared, message prop)
├─ features/expenses
│   └─ SummaryCard               props: total, count, share, surplus, surplusRecipientName → SummaryRow ×3 (+ rounding line)
└─ features/settlements
    ├─ TransferList → TransferItem      props: transfers, participants (name lookup)
    ├─ BalanceList  → BalanceItem       props: balances, participants
    ├─ ShareButton                      props: onShare, status
    ├─ ResetButton                      props: onReset (stateless, one tap)
    └─ UndoResetSnackbar                props: open, onUndo, onDismiss
```
- Max prop depth from `App` is 2 (App → ParticipantList → ParticipantEditForm), so **no Context**. `MoneyField` reads Formik's own form context via `useField`; that is the library's API, not app state in Context. `ParticipantList` chooses between `ParticipantItem` and `ParticipantEditForm` as siblings rather than nesting the form in the item.
- Each feature exports its public components from `index.ts`. `App.tsx` imports only from barrels.
- `features/settlements/lib/buildShareText.ts` is pure: `({ participants, total, share, surplus, surplusRecipientId, transfers }) → string`, formatted by `formatMoney`. Tested against the exact spec texts.
- Local UI state (editing id) is allowed in presentational components; domain state is not. The undo snapshot lives in `useAsado` because it is a copy of domain state.
- Lint guard: `react-refresh/only-export-components` already flags mixed exports. File size is checked in review (~120 lines → split).

### D10. Layout: xs first, then larger breakpoints
**xs (default, 360 px):** one column, `Container maxWidth="sm"` with 16 px side padding, sections stacked with `Divider`s, not cards:
1. `AppHeader`: `Typography h1` "AsadoSplit" + subtitle "Anotá cuánto puso cada uno y te decimos quién le transfiere a quién."
2. Section "Quiénes vinieron": `RestoreNotice` first when `restoreFailed` (MUI `Alert severity="info"`, `role="status"`, close `IconButton` "Cerrar aviso"), then `ParticipantForm` (two full-width `TextField`s stacked + full-width `Button` "Agregar", size large), then `ParticipantList` (`List` / `ListItem`; two lines per row: the name in bold, then "Puso $ …" in secondary text, because a 40-character name plus an amount plus two 48 px `IconButton`s does not fit on one line at 375 px) or `EmptyState`. Editing swaps a row for `ParticipantEditForm` in place: focus moves to its name field, and after "Guardar" or "Cancelar" focus returns to that row's edit button.
3. Section "Las cuentas": `SummaryCard` (the pizarra, see D11) with rows Total / Personas / Le toca a cada uno.
4. Section "Quién le transfiere a quién": `TransferList` (`List`), `BalanceList` (`List`, compact), `ShareButton` (full-width, contained) + status `Typography` in a `role="status"` region.
5. `ResetButton` (`Button variant="text"`, full-width, muted).
6. `UndoResetSnackbar`: MUI `Snackbar` anchored bottom-center, full-width on xs, message "Asado borrado", action `Button` "Deshacer" (48 px target). `autoHideDuration={6000}` → `onDismiss`. `onClose` ignores `reason === 'clickaway'` so a stray tap does not drop the undo. It is announced by the snackbar's built-in alert role.

**sm and up:** same single column; `Container` caps width (~600 px) and centers. Spacing and the pizarra's numeral size scale up via theme breakpoints. No multi-column layout.

**MUI components:** `Container`, `Stack`, `Box`, `Typography`, `Divider`, `TextField`, `Button`, `IconButton`, `List`/`ListItem`/`ListItemText`, `CssBaseline`, `ThemeProvider`. Icons from `@mui/icons-material` (`EditOutlined`, `DeleteOutlined`, `IosShare`, `Close`). Beyond the basics:
- `@mui/icons-material` ships the a11y-friendly SVG icons the edit/remove buttons need.
- `Snackbar` is used only for reset undo. Undo needs a transient, non-blocking surface with an action that stays put while the page reflows to its empty state, which is what Snackbar provides (timeout, live-region announcement, safe positioning above the mobile keyboard area). It is not modal and doesn't trap focus. Share status stays inline, not in a snackbar.

- `Alert` is used only for the recovery notice. It is an inline, dismissible message with an icon and a built-in close action. It is overridden to `role="status"` so it is announced politely, not as an alert.

Not used: `Card`, `Dialog`, `Tabs`, `Drawer`.

**Inputs:** `name` with `autoComplete="off"`, `enterKeyHint="next"`; contribution via `MoneyField`: `inputMode="numeric"` (whole pesos only, so a digits keypad is enough), `enterKeyHint="done"`, no adornment (the `$` comes from the blur reformat), helper "En pesos. Dejalo vacío si no puso nada.".

### D11. Visual direction & theme (`src/theme/index.ts`)
- **Memorable element: the pizarra.** The summary is a dark charcoal slab that recalls the chalkboard price board at a carnicería or parrilla. The total sits in large chalk-white slab-serif numerals, with plain sentence-case labels ("Total", "Personas", "Le toca a cada uno") in the system body font. It is flat: no shadow, no gradient, square-ish corners (4 px).
- **Everything else stays quiet:** warm bone paper background, charcoal text, hairline dividers, no cards, no shadows (`shadows` overridden to `none`), no gradient washes, no uppercase labels (`button.textTransform: 'none'`).
- **Palette** (checked for AA contrast during implementation; adjust if a pair fails):
  - background `#F6F1E7` (bone), text `#231C17` (charcoal), secondary text `#5A4E44`
  - primary `#A63A12` (ember), used for the main buttons and the focus ring
  - receives `#2E6B3A` (chimichurri); pays: charcoal text plus the word "Pone" (meaning never depends on color alone)
  - pizarra `#2B2622`, chalk text `#F3EFE6`
- **Type:** one self-hosted display slab (`@fontsource/bitter`, **single weight 700, latin subset only**, imported as `@fontsource/bitter/latin-700.css`) for `h1`, section headings and the pizarra numerals; system UI stack for body; `font-variant-numeric: tabular-nums` on amounts.
- **Touch/focus:** theme overrides set `minHeight: 48` on buttons/inputs and a 3 px ember `:focus-visible` outline with offset on all interactive components.
- **Copy:** sentence case, voseo, short.

### D12. Tooling, base path and deploy
- Vitest in `vite.config.ts` (`test.environment: 'jsdom'`, `setupFiles: src/test/setup.ts` for jest-dom). Domain tests can run in `node` via a per-file `@vitest-environment node` comment.
- `tsconfig.app.json`: add `"strict": true`. Prettier + `eslint-config-prettier`; scripts `test` (`vitest run`), `test:watch`, `format`.
- **Base path:** `base: './'` in `vite.config.ts`. Asset URLs are relative, so the build works at `https://<user>.github.io/asado-split/`, at a custom domain root, and in `vite preview`, without hard-coding the repo name. This is safe because the app has no client-side router.
- **Deploy workflow (file created in this change):** `.github/workflows/deploy.yml`, triggered on `push` to `main` plus `workflow_dispatch`.
  - `build` job: `actions/checkout`, `actions/setup-node` (Node LTS, `cache: yarn`), `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`, `yarn build`, `actions/configure-pages`, `actions/upload-pages-artifact` (`path: dist`).
  - `deploy` job: needs `build`, `environment: github-pages`, runs `actions/deploy-pages`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages` with `cancel-in-progress: false`.
  - The workflow uses yarn rather than `npm ci` because the repo is locked with `yarn.lock` and has no `package-lock.json` (decided in review).
  - It is free on public repos. The file does nothing until a remote exists. **Out of scope and requiring explicit authorization:** creating the remote repo, pushing, and enabling Pages (Settings → Pages → Source: GitHub Actions).

### D13. Form ↔ asado contract for invalid input: option (b), validated input
Two options were considered for how the form learns that an add or update failed:
- (a) `addParticipant`/`updateParticipant` return `{ ok: true } | { ok: false; error }` to the form;
- (b) the Yup schema knows the existing names and the hook assumes validated input.

**Chosen: (b).**
- **Yup is the single source of user-facing validation.** Errors appear inline, on blur and before submit, with the exact es-AR strings from the spec. With (a), duplicates would only be caught after submit and need a second error-mapping path (`setFieldError` from domain codes), which duplicates the messages.
- **The name list is current.** The schema factory `createParticipantSchema(participants, exceptId?)` closes over the `participants` prop. That is the same list the reducer applies the change to, since a single user edits on one device with nothing else writing concurrently. A closure is used rather than Yup `context` because Formik's `validationSchema` does not pass a context. `useMemo` rebuilds the schema when `participants` changes, which is equivalent.
- **(a) fits `useReducer` poorly.** `dispatch` returns nothing, so a synchronous result would need a ref that mirrors the state, adding complexity for no user-visible gain.

**Safety net, so (b) can never crash:** the reducer calls the result-returning domain functions from D2. On `ok: false` it returns the **previous state unchanged**. A `DomainError` is therefore never thrown inside a React state update, by construction. An invalid change that bypasses the form is ignored silently, as the participant-management spec requires.

## Risks / Trade-offs

- [Native share unavailable on desktop Firefox; clipboard requires a secure context] → GitHub Pages is HTTPS and localhost counts as secure; the explicit error message covers the rest.
- [`crypto.randomUUID` needs a secure context] → same as above. `lib/id.ts` falls back to `Date.now()` + counter + `Math.random` string when missing. IDs never affect computation order.
- [Greedy can produce more transfers than optimal] → accepted and documented. The bound `payers + receivers − 1` is tested.
- [Rounding up makes the people who pay transfer up to `n − 1` pesos more in total than an exact split] → accepted for round, easy-to-transfer amounts. The surplus is shown openly on the pizarra and in the shared text ("Redondeado para arriba: sobran $ 8 para Franco."), so nothing is hidden.
- [Stored data from before the whole-peso rule may contain centavos] → treated as invalid by the domain invariant (multiple of 100): discarded, with the recovery notice. Accepted, since nothing has been deployed yet.
- [Discarding the whole stored asado on any invalid entry loses valid entries too] → accepted for MVP simplicity. Partial recovery could violate uniqueness invariants.
- [One-tap reset is easy to hit by accident] → immediate undo for 6 s, and clickaway doesn't dismiss. Accepted limit: after the timeout, or after a reload during the snackbar, the reset is final. The snapshot is never persisted, by design: only participants are stored.
- [Adding a web font costs bytes] → one self-hosted family, one weight, latin subset only. No third-party font CDN.

## Migration Plan

Greenfield; nothing to migrate. Storage `version: 1` is the first schema. Rollback is reverting the commit, since stored data from v1 stays readable.
