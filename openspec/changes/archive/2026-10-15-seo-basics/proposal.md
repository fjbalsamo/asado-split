# Proposal

## Why

Link previews (change `link-preview`) cover sharing, but people also look for "dividir gastos asado" on Google. Today the page title is just "AsadoSplit", there is no canonical URL, sitemap or structured data, and `#root` is empty until JavaScript runs, so crawlers that skip JS see no text. Basic, free SEO signals give the app a chance to be found and verified in Google Search Console.

## What Changes

- `<title>` becomes "AsadoSplit: dividí los gastos del asado". `og:title` stays "AsadoSplit: las cuentas claras, el asado tranquilo". This supersedes the `<title>` value in the `link-preview` change (still unarchived), whose spec and test are updated to drop it.
- Add `<link rel="canonical" href="https://fjbalsamo.github.io/asado-split/">`.
- Ship the Google Search Console HTML verification file `public/google3de465d4d5f76b9f.html` (provided by the owner, kept byte-for-byte) instead of a verification meta tag.
- Add `public/sitemap.xml` listing only the canonical URL.
- Add a JSON-LD `WebApplication` block in `index.html` (name, url, description, inLanguage, applicationCategory, operatingSystem, free offer in ARS, author).
- Add static fallback content inside `#root` (an h1 "AsadoSplit" and the one-line description) that React replaces on mount.
- Extend the Vitest metadata test to cover all of the above.

## Out of scope

- `robots.txt`: on a github.io project site it is only read at the domain root (`fjbalsamo.github.io/robots.txt`), which this repo does not control. The sitemap is submitted by hand in Search Console instead.
- Prerendering or SSR of the full app, multiple pages or routes, hreflang, analytics, paid SEO tools or any service with a cost.
- Changing `og:title`, the preview image or the icons.

## Capabilities

### New Capabilities
- `search-indexing`: what search engines can read from the page without JavaScript (title, canonical URL, structured data, fallback text), the sitemap, and site ownership verification.

### Modified Capabilities

None in `openspec/specs/`. The `<title>` value moves from the in-flight `link-preview` change to `search-indexing`. That change's delta spec is edited directly, since it is not archived yet.

## Impact

- `index.html` (head and `#root` contents), new `public/sitemap.xml`, `public/google3de465d4d5f76b9f.html`, `src/linkPreview.test.ts` (title assertion moves out), a new test file for search indexing.
- No runtime code changes: `createRoot(...).render()` in `src/main.tsx` already replaces `#root` children. No new dependencies, no cost.
