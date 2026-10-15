# Design

## Context

See proposal.md (Why) and `specs/search-indexing/spec.md` for the exact values. State after the unarchived `link-preview` change:
- `index.html` holds description, OG/Twitter, `theme-color`, favicon and apple-touch-icon. Preview URLs are hard-coded absolute. `#root` is empty.
- `src/linkPreview.test.ts` reads the source `index.html` with jsdom's `DOMParser` and asserts `<title>` "AsadoSplit".
- `src/main.tsx` mounts with `createRoot(root).render(...)`, which clears existing children of `#root` on first render.
- The app's own header renders an h1 "AsadoSplit" (asserted in `App.wiring.test.tsx`).
- The deploy workflow runs `yarn test` before `yarn build`. A failing test blocks deployment.

## Goals / Non-Goals

**Goals:**
- Static, crawler-readable SEO signals with no runtime code, build step or dependency.
- One test file per capability: link-preview checks stay in `linkPreview.test.ts`, and search indexing gets `src/searchIndexing.test.ts`.

**Non-Goals:**
- No UI change: layout, MUI components, forms, money, settlement and localStorage are untouched, so those design sections do not apply. The xs layout is unchanged once React mounts.
- No change to the Vite base path or the deploy workflow.

## Decisions

### D1. Title ownership moves to search-indexing
`link-preview` is not archived, so `search-indexing` cannot MODIFY its requirement through a delta. Instead, the `link-preview` delta spec drops the `<title>` line and its "Browser tab keeps the short title" scenario, `linkPreview.test.ts` drops the title assertion, and `search-indexing` owns the title. Both changes archive cleanly in either order.

### D2. Canonical and JSON-LD use hard-coded absolute URLs
This matches link-preview D1. Vite leaves `<link rel="canonical">` with an absolute href untouched, and does not process `application/ld+json` script contents.

### D3. JSON-LD shape
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AsadoSplit",
  "url": "https://fjbalsamo.github.io/asado-split/",
  "description": "<meta description>",
  "inLanguage": "es-AR",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ARS" },
  "author": { "@type": "Person", "name": "fjbalsamo" }
}
```
`price` is the string "0", the form Google's rich results docs use. The test parses the block with `JSON.parse` and compares the fields, including `description` against the meta description.

### D4. Fallback content inside `#root`
Plain `<h1>AsadoSplit</h1><p>…description…</p>` with no styling. React's first render replaces it, so there is never a duplicate h1 at runtime. The fallback flashes briefly as unstyled text only on slow loads. That is acceptable, and it is better than a blank page. No `<noscript>`, since that would duplicate the text.

### D5. Verification by HTML file, not meta tag
Google's HTML-file method needs the issued file served at the property root, which for a URL-prefix property is `/asado-split/`. `public/` is copied verbatim to the `dist/` root, so `public/google3de465d4d5f76b9f.html` lands at the right URL with no head clutter and no token in `index.html`. The test reads the file and compares its full content byte-for-byte, so a missing file, a rename or a formatter adding a newline all fail. It also asserts that `index.html` has no verification meta tag.
*Alternative:* the meta tag. Dropped by the owner in favor of the file.

### D6. Sitemap
Static `public/sitemap.xml` with one `<url><loc>` and no `lastmod`, since a stale date is worse than none. The test parses it with `DOMParser` as `application/xml`, checks for no `parsererror`, and expects exactly one `loc` equal to the canonical URL. Because there is no `robots.txt`, the sitemap is submitted by hand in Search Console.

### Deploy
Deployment is unchanged: GitHub Pages serves `public/sitemap.xml` at `/asado-split/sitemap.xml`. Steps after deploy:
1. Deploy.
2. Verify the URL-prefix property in Search Console.
3. Submit `https://fjbalsamo.github.io/asado-split/sitemap.xml`.
4. Optionally run the Rich Results Test on the URL.

Rollback is a revert commit.

## Risks / Trade-offs

- [`yarn format` (Prettier) could rewrite the verification HTML file] → The exact-content test fails if that happens. Adding the file to `.prettierignore` would prevent it.
- [Fallback and app text drift apart] → The fallback paragraph is tested to equal the meta description, and the h1 to equal "AsadoSplit".
- [Search engines treat the fallback as cloaking] → The fallback is a faithful summary of the same page, not hidden or keyword-stuffed content.
