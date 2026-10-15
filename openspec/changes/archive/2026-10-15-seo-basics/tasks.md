# Tasks

No domain logic changes in this change, so there are no domain tasks or reference-asado fixture.

## 1. Guard test (TDD)

- [x] 1.1 Add `src/searchIndexing.test.ts` covering every `search-indexing` requirement: title, canonical, sitemap (valid XML, single `loc`), JSON-LD (`JSON.parse` plus exact fields, description equal to the meta description), `#root` fallback h1 and paragraph, verification file with exact content and no verification meta tag. Move the `<title>` assertion out of `src/linkPreview.test.ts`. Verify the new file fails before task 2.1, except the verification file cases, which already pass.

## 2. Page and assets

- [x] 2.1 Update `index.html`: new `<title>`, canonical link, JSON-LD block, `#root` fallback content (spec: title, canonical, structured data, fallback). Verify the matching cases in `src/searchIndexing.test.ts` pass.
- [x] 2.2 Add `public/sitemap.xml` with the single canonical URL (spec: "Canonical URL and sitemap"). Verify the sitemap cases pass.
- [x] 2.3 Verify the app replaces the fallback: `src/App.wiring.test.tsx` still finds exactly one level-1 heading "AsadoSplit" (spec: "App replaces the fallback").

## 3. Integration

- [x] 3.1 Run `yarn lint`, `yarn test` and `yarn build`. Verify all pass and `dist/` contains `sitemap.xml`, `google3de465d4d5f76b9f.html` (unchanged bytes) and an `index.html` with the canonical link and JSON-LD.
- [ ] 3.2 (user, after deploy) Verify the property in Search Console with the HTML file method, submit `https://fjbalsamo.github.io/asado-split/sitemap.xml`, and run the Rich Results Test. Verify the property is verified and the WebApplication is detected.
