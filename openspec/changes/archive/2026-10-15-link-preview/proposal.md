# Proposal

## Why

The app spreads by its link being dropped into the group chat, but today `index.html` only has `<title>AsadoSplit</title>`: WhatsApp, Telegram, Slack, X and iMessage show a bare URL with no name, description or image. A rich preview makes the link look trustworthy and tells the group what it is before anyone taps it.

## What Changes

- Add link-preview metadata to `index.html`: `meta description`, Open Graph (`og:title`, `og:description`, `og:image` with type/width/height/alt, `og:url`, `og:type`, `og:locale`, `og:site_name`), `twitter:card` + `twitter:image`, and `theme-color`. `<title>` is left to the `seo-basics` change.
- All preview URLs are hard-coded absolute HTTPS URLs under `https://fjbalsamo.github.io/asado-split/`, because crawlers cannot resolve the relative URLs produced by Vite `base: './'`.
- Add `public/og-image.jpg` (1200×630 JPEG, 146 kB, Pexels photo of an asado, no text overlay) as the preview image.
- Add `public/apple-touch-icon.png` (180×180 PNG, charcoal background with a chalk mark in the pizarra style) and link it from `index.html`.
- Replace `public/favicon.svg` (today the stock Vite logo) with an SVG of the same chalk mark on the charcoal background.
- Add a Vitest test that guards the metadata in the source `index.html` (tags present, absolute HTTPS URLs, no unreplaced `%VITE_` placeholders) and the preview image (1200×630 read from the JPEG header, under 300 kB).

## Out of scope

- Build-time image generation (reusing the canvas renderer would need a native canvas dependency in CI) and any Vite env var / `%VITE_SITE_URL%` substitution.
- Per-asado dynamic previews (would need a server; violates zero cost).
- Web app manifest, PWA install, raster favicons (`favicon.ico`, PNG sizes).
- Any paid or third-party service; previews are verified manually with free tools (Facebook Sharing Debugger, opengraph.xyz).

## Capabilities

### New Capabilities
- `link-preview`: the metadata and static assets that make a shared link to the app render a preview with its name, description and image in chat apps, plus the iOS home-screen icon and the browser-tab favicon, which share one chalk mark.

### Modified Capabilities

None.

## Impact

- `index.html` (head only), `public/og-image.jpg`, `public/apple-touch-icon.png`, `public/favicon.svg` (replaced), one new test file under `src/`.
- No runtime code, dependencies, deploy workflow or cost changes. A custom domain in the future means editing the hard-coded URLs (the test will flag stale ones only if they stop being HTTPS).
