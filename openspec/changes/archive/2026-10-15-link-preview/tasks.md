# Tasks

No domain logic changes in this change, so there are no domain tasks or reference-asado fixture.

## 1. Guard test (TDD)

- [x] 1.1 Add `src/linkPreview.test.ts` covering "Page metadata describes the app for link previews" and "Preview image is absolute, light and described": exact tag values parsed from the source `index.html`, `https://` preview URLs, no `%VITE_`, `public/og-image.jpg` 1200×630 from the JPEG header and under 300 kB. Verify it fails on the metadata cases before task 2.1, and the image cases already pass.

## 2. Metadata and assets

- [x] 2.1 Add the description, Open Graph, Twitter and `theme-color` tags to `index.html`, keeping `<title>AsadoSplit</title>` (spec: both metadata requirements). Verify `yarn test` passes `src/linkPreview.test.ts`.
- [x] 2.2 Replace `public/favicon.svg` with the chalk parrilla mark on charcoal (spec: "Browser-tab favicon"). Add a test case asserting the favicon link, both pizarra colors and no `#863bff`. Verify `yarn test` passes.
- [x] 2.3 Draw `public/apple-touch-icon.png` (180×180, same mark and geometry as the favicon) with a throwaway scratchpad script and link it from `index.html` (spec: "iOS home-screen icon"). Add a test case asserting the link and the 180×180 size from the PNG header. Verify `yarn test` passes.

## 3. Integration

- [x] 3.1 Run `yarn lint`, `yarn test` and `yarn build`. Verify all pass and that `dist/index.html` keeps the absolute preview URLs and `dist/` contains `og-image.jpg`, `apple-touch-icon.png` and `favicon.svg`.
- [ ] 3.2 After deploy (manual, by the user): share the URL with a fresh query string in WhatsApp, Telegram, Slack, X and iMessage, and check opengraph.xyz and the Facebook Sharing Debugger. Verify each shows the title, description and photo.
