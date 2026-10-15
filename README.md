# AsadoSplit

Split the cost of an asado among friends from your phone. Write down what each person put in,
and AsadoSplit shows the total, each person's share and **who transfers how much to whom**. You
can send the results to the group chat as images, "Compartir transferencias" (who sends how
much to whom) and "Compartir aportes" (what each person put in), or as plain text with
"Compartir como texto".

- Single page, built for phones first. The interface is in Argentine Spanish (voseo).
- Whole pesos, no centavos. Everyone pays the same share, rounded up to the next peso. The few
  extra pesos from rounding go to whoever put in the most, and the app says so ("Redondeado para
  arriba: sobran $ 8 para Franco.").
- Runs entirely in the browser: no backend and no accounts. Data stays in the browser's
  `localStorage`.
- Free hosting on GitHub Pages.

## Requirements

- Node.js LTS (developed on Node 24)
- Yarn Classic 1.22 (pinned in `package.json` → `packageManager`). With Corepack: `corepack enable`.

## Setup

```bash
yarn install --frozen-lockfile
yarn dev            # http://localhost:5173
```

To try it on a phone on the same Wi-Fi network: `yarn dev --host`, then open the "Network" URL.

## Commands

| Command           | What it does                                            |
| ----------------- | ------------------------------------------------------- |
| `yarn dev`        | Dev server with hot reload                              |
| `yarn test`       | Runs every Vitest test once (shuffled order)            |
| `yarn test:watch` | Vitest in watch mode                                    |
| `yarn lint`       | ESLint                                                  |
| `yarn format`     | Prettier (writes changes)                               |
| `yarn build`      | Type-check (`tsc -b`) and production build into `dist/` |
| `yarn preview`    | Serves the production build locally                     |

## Project structure

```
src/
  domain/      Pure TypeScript rules: money, shares, balances, settlement (no React)
  lib/         localStorage persistence (versioned) and id generation
  hooks/       useAsado (state + derived values), useShareSummary (share / clipboard)
  theme/       The single MUI theme and its design tokens
  components/  Shared UI (AppHeader, Section, EmptyState, MoneyField)
  features/    participants · expenses · settlements, one component per file
  App.tsx      Composes the page; the only consumer of the hooks
```

Specs, design decisions and tasks live in `openspec/` (OpenSpec workflow).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` runs on every push to `main`, or manually from the Actions tab. It
installs dependencies, runs lint, tests and the build, and publishes `dist/` to GitHub Pages. The
build uses relative asset paths (`base: './'`), so it works under the repo subpath without any
configuration.

One-time manual steps (not automated):

1. Create a **public** GitHub repository (Pages is free for public repos on GitHub Free).
2. Push this project to its `main` branch.
3. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. The next push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**) publishes the
   app at `https://<your-user>.github.io/<repo-name>/`.

## Known limitations

- **Data lives in one browser on one device.** There is no sync or sharing of the live asado.
  Clearing site data, or using private browsing, loses it.
- **Invalid saved data is discarded as a whole** (with a notice). There is no partial recovery.
- **"Deshacer" after "Empezar otro asado" lasts 6 seconds** and does not survive a page reload.
- **Rounding up costs the people who pay up to (participants − 1) pesos in total.** That amount goes
  to the top contributor and is shown on the summary and in the shared text.
- **Equal split only.** There are no per-item expenses, unequal shares or multiple currencies.
- **Transfers use a greedy algorithm.** It is deterministic and settles every balance exactly,
  but it does not guarantee the minimum possible number of transfers.
- **Sharing depends on the browser.** Images are shared as files only where the browser supports
  it (recent iOS Safari and Android Chrome); elsewhere, e.g. most desktop browsers, each button
  downloads its PNG pages instead, one after another. Plain text falls back to the clipboard, which requires HTTPS or
  `localhost`.
- **Images are 1080 px wide with up to 12 rows each.** Longer lists become numbered pages
  ("1/2", "2/2"). Very long names are shortened with "…" on the images.
- **Bundle size:** about 550 kB minified / 175 kB gzip, mostly MUI. Vite warns above 500 kB.
- **Single-device editing assumed.** Two tabs of the same browser do not sync with each other.
