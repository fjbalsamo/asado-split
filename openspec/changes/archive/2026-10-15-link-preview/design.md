# Design

## Context

See proposal.md (Why) and `specs/link-preview/spec.md` for the exact values. Current state:
- `index.html` has only charset, viewport, `<title>AsadoSplit</title>` and `/favicon.svg` (the stock Vite logo).
- `vite.config.ts` uses `base: './'` so the build works under any GitHub Pages subpath. The deploy workflow runs `yarn lint`, `yarn test`, `yarn build`, in that order, then publishes `dist/`.
- Pizarra tokens live in `src/theme/tokens.ts` (`charcoal #231C17`, `chalk #F3EFE6`).
- `public/og-image.jpg` is already in place (1200×630 baseline JPEG, 146 kB).

## Goals / Non-Goals

**Goals:**
- Static, crawler-readable metadata with no runtime or build-step logic.
- A test that fails fast when a tag, an absolute URL or the image budget regresses.

**Non-Goals:**
- No UI change: layout, MUI components, forms, money, settlement and localStorage are untouched, so none of those design sections apply.
- No change to the deploy workflow or the Vite base path.

## Decisions

### D1. Hard-coded absolute URLs in `index.html`
Crawlers need absolute `og:url` / `og:image`. Vite rewrites a relative `og:image` against `base: './'`, which keeps it relative, but it leaves absolute `https://` URLs alone. Hard-coding `https://fjbalsamo.github.io/asado-split/` gives identical output locally and in CI.
*Alternative:* `%VITE_SITE_URL%` set in `deploy.yml`. Rejected: an extra moving part for a single stable site, local builds would need a `.env`, and a missing variable ships the literal placeholder.

### D2. Static assets in `public/`
`og-image.jpg` and `apple-touch-icon.png` are committed files that Vite copies verbatim to `dist/` root, which is the deployed site root.
*Alternative:* render the preview at build time with the existing canvas renderer. Rejected: it is DOM-bound and would need a native canvas package in CI for an image that never changes.

### D3. apple-touch-icon drawn once with a throwaway script
The 180×180 PNG is produced once by a script run from the session scratchpad (Pillow is available locally), not committed and not part of the build. Design: full-bleed `charcoal` square (iOS rounds the corners itself) with a chalk-colored parrilla mark: a rounded grill outline with a few horizontal bars, stroked in `chalk`, centered with generous padding. Only the PNG is committed. It is linked as `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, same form as the existing favicon link, so Vite resolves it against `base`.

### D3b. SVG favicon is the source of the mark
`public/favicon.svg` is hand-written SVG: a charcoal rect plus the parrilla mark stroked in chalk, on a 180-unit viewBox matching the PNG geometry. The throwaway script draws the PNG from the same coordinates, so both icons stay identical. At 16 px the bars must stay legible, so the mark uses few, thick strokes. The existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` stays as is.

### D4. Guard test on the source `index.html`
Tests run before the build in CI, so the test reads the source `index.html` (identical to `dist/` for absolute URLs) and `public/og-image.jpg` from the project root via `node:fs`.
- Tags are parsed with jsdom's `DOMParser` (the default Vitest environment), then compared to the exact expected values.
- URL check: `og:url`, `og:image`, `twitter:image` start with `https://`. Placeholder check: the raw HTML does not contain `%VITE_`.
- Image check: size below 300 kB, and dimensions read from the JPEG header by walking the segment markers to the first SOFn frame (`0xFFC0`-`0xFFCF` except `C4`, `C8`, `CC`) and reading height/width as big-endian 16-bit values. No image library is added.
- `tsconfig.app.json` only includes `vite/client` types, so the test file adds `/// <reference types="node" />` for `node:fs` / `node:path` (`@types/node` is already a dev dependency).

### Deploy
GitHub Pages deploy is unchanged: the files in `public/` land at the site root, and `index.html` points at them with absolute URLs. Rollback is a revert commit. After deploy, wait for the ~10-minute Pages cache before checking previews. To refresh, use Facebook Sharing Debugger "Scrape again" and test with a fresh query string (e.g. `?t=1`). If the image changes later, append `?v=2` to `og:image` / `twitter:image`.

## Risks / Trade-offs

- [Custom domain or repo rename makes the hard-coded URLs stale] → One-line edits in `index.html`. The test pins the exact URL, so it will fail if only some of them are updated.
- [WhatsApp caches the old bare-URL preview] → Verify with a fresh query string. Scraping in the Sharing Debugger usually refreshes Meta's cache.
- [Third-party photo licensing] → The Pexels license allows free use without attribution. No text overlay is added.
- [Manual-only visual check] → The CI test covers structure and budget. The look on each app is checked by hand once after deploy.
