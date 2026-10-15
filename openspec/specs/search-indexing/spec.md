# search-indexing Specification

## Purpose
Lets search engines find, understand and index the app without running JavaScript, and lets the owner verify the site in Google Search Console.

## Requirements

### Requirement: Descriptive page title
The served HTML SHALL have the `<title>` "AsadoSplit: dividí los gastos del asado". The Open Graph title SHALL stay "AsadoSplit: las cuentas claras, el asado tranquilo".

#### Scenario: Search result title
- **GIVEN** the app is deployed
- **WHEN** a crawler reads the page `<head>`
- **THEN** the title is "AsadoSplit: dividí los gastos del asado" and `og:title` is "AsadoSplit: las cuentas claras, el asado tranquilo"

### Requirement: Canonical URL and sitemap
The served HTML SHALL declare `<link rel="canonical" href="https://fjbalsamo.github.io/asado-split/">`. The site SHALL serve `sitemap.xml` at `https://fjbalsamo.github.io/asado-split/sitemap.xml`, a valid sitemaps.org XML document with exactly one `<url>` whose `<loc>` is the canonical URL. No `robots.txt` SHALL be added.

#### Scenario: Query strings collapse to the canonical URL
- **GIVEN** a user shares `https://fjbalsamo.github.io/asado-split/?t=1`
- **WHEN** a search engine indexes that URL
- **THEN** it finds the canonical link pointing to `https://fjbalsamo.github.io/asado-split/`

#### Scenario: Sitemap lists only the canonical URL
- **GIVEN** the sitemap file shipped with the app
- **WHEN** it is parsed as XML
- **THEN** it has exactly one `<loc>`, equal to `https://fjbalsamo.github.io/asado-split/`

### Requirement: Structured data describes the app
The served HTML SHALL contain one `<script type="application/ld+json">` block that parses as JSON and describes a schema.org `WebApplication` with:
- `name`: "AsadoSplit"
- `url`: "https://fjbalsamo.github.io/asado-split/"
- `description`: the same text as the meta description ("Dividí los gastos del asado en un minuto: quién puso cuánto y quién le transfiere a quién.")
- `inLanguage`: "es-AR"
- `applicationCategory`: "FinanceApplication"
- `operatingSystem`: "Any"
- `offers`: an `Offer` with `price` "0" and `priceCurrency` "ARS"
- `author`: a `Person` named "fjbalsamo"

#### Scenario: Valid JSON-LD
- **GIVEN** the page HTML
- **WHEN** the JSON-LD block is parsed with a JSON parser
- **THEN** it parses without error and has every field above with its exact value

#### Scenario: Description stays in sync
- **GIVEN** the meta description and the JSON-LD description
- **WHEN** they are compared
- **THEN** they are identical

### Requirement: Text visible without JavaScript
The `#root` element in the served HTML SHALL contain fallback content: an `h1` "AsadoSplit" and a paragraph with the meta description text. When the app mounts, it SHALL replace this content entirely, so on a phone (xs) the user never sees the fallback and the app side by side.

#### Scenario: Crawler without JavaScript
- **GIVEN** a crawler that does not run scripts
- **WHEN** it reads the page body
- **THEN** it finds the heading "AsadoSplit" and the description text

#### Scenario: App replaces the fallback
- **GIVEN** a user opens the app on a phone with JavaScript enabled
- **WHEN** the app mounts
- **THEN** the page shows only the app, with exactly one level-1 heading "AsadoSplit"

### Requirement: Search Console ownership verification
The site SHALL serve the Google Search Console verification file at `https://fjbalsamo.github.io/asado-split/google3de465d4d5f76b9f.html` for the URL-prefix property `https://fjbalsamo.github.io/asado-split/`. Its content SHALL be exactly "google-site-verification: google3de465d4d5f76b9f.html", the file issued by Google, with no other bytes. The HTML page SHALL NOT carry a `google-site-verification` meta tag.

#### Scenario: Verification file is served unchanged
- **GIVEN** the verification file shipped with the app
- **WHEN** its contents are read
- **THEN** they are exactly "google-site-verification: google3de465d4d5f76b9f.html"

#### Scenario: Altered or missing file is rejected
- **GIVEN** the verification file is missing, renamed, or its content differs (for example, a trailing newline added by a formatter)
- **WHEN** the automated checks run
- **THEN** they fail

#### Scenario: No verification meta tag
- **GIVEN** the page HTML
- **WHEN** a crawler reads the `<head>`
- **THEN** there is no `meta name="google-site-verification"`
