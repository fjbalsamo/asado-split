# Spec Delta

## Purpose

Makes a shared link to the app render a rich preview (name, description and image) in chat apps such as WhatsApp, Telegram, Slack, X and iMessage, and gives the app its own icon in the browser tab and on an iOS home screen.

## ADDED Requirements

### Requirement: Page metadata describes the app for link previews
The served HTML SHALL contain, in its `<head>` and without depending on JavaScript, the following metadata with these exact values:
- `meta name="description"` and `og:description`: "Dividí los gastos del asado en un minuto: quién puso cuánto y quién le transfiere a quién."
- `og:title`: "AsadoSplit: las cuentas claras, el asado tranquilo"
- `og:site_name`: "AsadoSplit"
- `og:type`: "website"
- `og:locale`: "es_AR"
- `og:url`: "https://fjbalsamo.github.io/asado-split/"
- `twitter:card`: "summary_large_image"
- `theme-color`: "#231C17"

The description SHALL be at most 110 characters so phones do not cut it. The `<title>` is owned by the `search-indexing` capability.

#### Scenario: WhatsApp preview shows name and description
- **GIVEN** the app is deployed at https://fjbalsamo.github.io/asado-split/
- **WHEN** a user pastes that URL into a WhatsApp chat on a phone
- **THEN** the preview shows the title "AsadoSplit: las cuentas claras, el asado tranquilo" and the description "Dividí los gastos del asado en un minuto: quién puso cuánto y quién le transfiere a quién."

#### Scenario: Crawler without JavaScript reads the metadata
- **GIVEN** a crawler that fetches the page HTML and does not run scripts
- **WHEN** it parses the `<head>`
- **THEN** it finds every tag listed above with its exact value

### Requirement: Preview image is absolute, light and described
The served HTML SHALL declare a preview image with:
- `og:image` and `twitter:image`: "https://fjbalsamo.github.io/asado-split/og-image.jpg"
- `og:image:type`: "image/jpeg"
- `og:image:width`: "1200" and `og:image:height`: "630"
- `og:image:alt`: "Asado en la parrilla"

The image file SHALL be a JPEG of exactly 1200×630 px and smaller than 300 kB, so WhatsApp does not skip it. Every preview URL (`og:url`, `og:image`, `twitter:image`) SHALL be an absolute `https://` URL, and the HTML SHALL NOT contain unreplaced build placeholders (`%VITE_`).

#### Scenario: Large image card in chat apps
- **GIVEN** the app is deployed
- **WHEN** a user shares the URL in WhatsApp, Telegram, Slack, X or iMessage
- **THEN** the preview shows the asado photo as a large image card

#### Scenario: Preview image within limits
- **GIVEN** the image file shipped with the app
- **WHEN** its header and size are inspected
- **THEN** it is a JPEG of 1200×630 px and smaller than 300 kB

#### Scenario: Relative preview URL is rejected
- **GIVEN** `og:image` is changed to "./og-image.jpg"
- **WHEN** the automated checks run
- **THEN** they fail because the preview URL is not an absolute https URL

#### Scenario: Unreplaced placeholder is rejected
- **GIVEN** the HTML contains "%VITE_SITE_URL%"
- **WHEN** the automated checks run
- **THEN** they fail

### Requirement: iOS home-screen icon
The served HTML SHALL link an `apple-touch-icon` that is a 180×180 px PNG with the charcoal background (#231C17) and a simple chalk-colored mark in the pizarra style.

#### Scenario: Add to home screen on iPhone
- **GIVEN** a user on iOS Safari at the app's URL
- **WHEN** they choose "Agregar a inicio"
- **THEN** the home-screen icon is the charcoal square with the chalk mark, not a page screenshot

### Requirement: Browser-tab favicon
The served HTML SHALL link an SVG favicon that shows the same chalk mark as the apple-touch-icon, drawn in chalk (#F3EFE6) on a charcoal (#231C17) background. The stock Vite logo SHALL NOT be shipped.

#### Scenario: Tab icon matches the home-screen icon
- **GIVEN** a user opens the app in a mobile browser
- **WHEN** they look at the tab or tab switcher
- **THEN** the icon is the charcoal square with the chalk parrilla mark, matching the apple-touch-icon

#### Scenario: Favicon uses the pizarra colors
- **GIVEN** the favicon file shipped with the app
- **WHEN** its contents are inspected
- **THEN** it is an SVG that uses #231C17 and #F3EFE6 and does not contain the Vite logo color #863bff
