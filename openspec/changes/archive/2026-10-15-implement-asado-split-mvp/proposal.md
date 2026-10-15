# Proposal

## Why

Splitting an asado among friends is still done with mental math and WhatsApp threads full of mistakes. AsadoSplit gives a phone-first, zero-cost page that turns "who put in how much" into "who transfers how much to whom" in under a minute, with exact amounts that add up to the cent.

## What Changes

- Add a pure, React-agnostic domain layer: participant rules, money parsing/formatting in es-AR, total, an equal share rounded up to whole pesos with the surplus going to the top contributor (amounts are whole pesos held as integer centavos), balances, and greedy settlement.
- Add versioned localStorage persistence of participants only, with safe parsing and fallback to an empty asado on corrupted or unknown data.
- Add two hooks: `useAsado` (participants state, CRUD, reset with in-memory undo, derived total/shares/balances/transfers via the domain) and `useShareSummary` (Web Share API with clipboard fallback and user-visible status).
- Add a single-page, mobile-first GUI built with MUI, Formik and Yup. Every component lives in its own file, grouped into feature folders with barrels. Copy is in es-AR with voseo. Amount fields reformat to es-AR on blur. "Empezar otro asado" resets immediately and offers "Deshacer" in a snackbar.
- Add tooling the stack requires but the template lacks: Vitest + React Testing Library (jsdom), Prettier, TypeScript `strict`, and a Vite `base` that works under a GitHub Pages subpath.
- Remove the Vite template leftovers (demo CSS, assets, counter).
- Add `.github/workflows/deploy.yml` (push to `main`: install → lint → test → build → deploy to GitHub Pages).

## Capabilities

### New Capabilities
- `money`: parsing user-entered whole-peso amounts (es-AR thousands separators, no centavos) into integer centavos, and formatting them for display without decimals.
- `expense-split`: total, equal per-person share rounded up to whole pesos, rounding surplus to the top contributor, and per-participant balances.
- `settlement`: deterministic greedy list of transfers that settles all balances.
- `participant-management`: adding, editing and removing participants and their contributions, with inline es-AR validation.
- `asado-persistence`: saving participants locally across reloads, recovering safely from bad data, and starting a new asado.
- `share-summary`: "Compartir cuentas" as WhatsApp-friendly plain text via native share or clipboard, with feedback.
- `app-shell`: single-page mobile-first layout, summary, empty states, theme and accessibility baseline.

### Modified Capabilities
- None. There are no existing specs.

## Impact

- New code under `src/domain`, `src/lib`, `src/hooks`, `src/theme`, `src/components`, `src/features/{participants,expenses,settlements}`. `src/App.tsx` and `src/main.tsx` are rewritten.
- New dependencies, all free and open source: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `formik`, `yup`, `@fontsource/bitter` (one weight, latin subset, self-hosted). New dev dependencies: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `prettier`, `eslint-config-prettier`.
- `package.json` scripts gain `test` and `format`. `tsconfig.app.json` gains `strict: true`. `vite.config.ts` gains `base` and the Vitest config.
- New `.github/workflows/deploy.yml` using only official GitHub Pages actions.
- No infrastructure, backend, or paid service. Hosting is GitHub Pages (free).

## Out of scope

- Auth, backend, database, serverless, any paid or third-party API.
- Payments, Mercado Pago, bank integrations, payment links.
- Unequal splits, per-item expenses, expense categories, multi-currency.
- User profiles, multi-device sync, multiple saved asados/history, push, analytics, AI.
- Modals, dialogs, extra screens or routing.
- Creating the remote GitHub repo, pushing, enabling Pages or triggering a deploy. Each needs explicit authorization. Only the workflow file is created here.
