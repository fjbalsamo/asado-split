# share-images Specification

## Purpose

Lets the user send the asado's results to the group chat as PNG images, one for the transfers and one for the contributions, each shared from its own button, built entirely on the device and readable at a glance in WhatsApp.

## Requirements

### Requirement: "Compartir transferencias" shares the transfers image
The "Compartir transferencias" button SHALL appear right below the "Quién le transfiere a quién" list whenever there is at least one transfer, and SHALL be hidden when there are no transfers. Tapping it SHALL share **only** the transfers image, with all its pages in order when paginated, as PNG files through the native share sheet when the browser supports sharing files. Its outcome SHALL be announced in its own polite live region right below it and cleared after 4 seconds:
- shared: "Listo, compartido."
- downloaded (see the download fallback): "Listo, descargado."
- failed: "No se pudo compartir. Probá de nuevo."
If the user cancels the share sheet (`AbortError`), no message SHALL be shown.

#### Scenario: Share the transfers image on a phone
- **GIVEN** a phone browser that can share files, with the reference asado
- **WHEN** the user taps "Compartir transferencias" and picks WhatsApp
- **THEN** the share sheet receives exactly one PNG file, `asado-transferencias-1.png`
- **AND** "Listo, compartido." is shown below that button only

#### Scenario: Paginated transfers
- **GIVEN** a phone browser that can share files and 15 participants with 14 transfers
- **WHEN** the user taps "Compartir transferencias"
- **THEN** the share sheet receives `asado-transferencias-1.png` then `asado-transferencias-2.png`, and no contributions image

#### Scenario: No transfers
- **GIVEN** only Franco with `500000` ($ 5.000), or A and B each with `1000000`
- **WHEN** the page is shown
- **THEN** "Compartir transferencias" is not shown and the transfers list shows "Nadie le debe nada a nadie."

#### Scenario: User cancels the share sheet
- **GIVEN** a phone browser that can share files
- **WHEN** the user taps "Compartir transferencias" and dismisses the share sheet
- **THEN** no message is shown and nothing is downloaded

#### Scenario: Sharing fails
- **GIVEN** the browser reports that sharing the files failed for a reason other than cancelling
- **WHEN** the user taps "Compartir transferencias"
- **THEN** "No se pudo compartir. Probá de nuevo." is shown below that button

### Requirement: "Compartir aportes" shares the contributions image
The "Compartir aportes" button SHALL appear right below the balances list ("Cómo quedó cada uno") whenever there is at least one participant. Tapping it SHALL share **only** the contributions image, with all its pages in order when paginated, as PNG files through the native share sheet when the browser supports sharing files. Its outcome SHALL be announced in its own polite live region right below it, with the same messages, 4-second reset and cancel behavior as "Compartir transferencias".

#### Scenario: Share the contributions image on a phone
- **GIVEN** a phone browser that can share files, with the reference asado
- **WHEN** the user taps "Compartir aportes"
- **THEN** the share sheet receives exactly one PNG file, `asado-aportes-1.png`
- **AND** "Listo, compartido." is shown below "Compartir aportes" only

#### Scenario: One participant
- **GIVEN** only Franco with `500000`
- **WHEN** the page is shown
- **THEN** "Compartir aportes" is shown and shares `asado-aportes-1.png`

#### Scenario: Statuses are independent
- **GIVEN** "Listo, compartido." is shown below "Compartir transferencias"
- **WHEN** sharing from "Compartir aportes" fails
- **THEN** "No se pudo compartir. Probá de nuevo." is shown below "Compartir aportes" and "Listo, compartido." stays below "Compartir transferencias"

#### Scenario: No participants
- **GIVEN** there are no participants
- **WHEN** the page is shown
- **THEN** neither "Compartir transferencias", "Compartir aportes" nor "Compartir como texto" is shown

### Requirement: Download fallback per button when files cannot be shared
When the browser cannot share files (no `navigator.share`, or `navigator.canShare({ files })` is false), tapping either image button SHALL download **every** page of that button's image, in page order, using the same file names. It SHALL then show "Listo, descargado." below that button once all downloads have started. Downloads SHALL start one after another with a short pause between them, and each file's temporary download link SHALL stay valid until after the last download has started. Browsers that keep only the last of several instant downloads, or that drop a download whose link was released too early, would otherwise lose every page but the last.

#### Scenario: Desktop browser without file sharing
- **GIVEN** a desktop browser that cannot share files, with the reference asado
- **WHEN** the user taps "Compartir aportes"
- **THEN** `asado-aportes-1.png` is downloaded and "Listo, descargado." is shown below "Compartir aportes"

#### Scenario: Paginated set downloads every page
- **GIVEN** a browser that cannot share files and 15 participants
- **WHEN** the user taps "Compartir transferencias", then "Compartir aportes"
- **THEN** `asado-transferencias-1.png` and `asado-transferencias-2.png` are downloaded in that order, then `asado-aportes-1.png` and `asado-aportes-2.png` in that order

### Requirement: Transfers image content
Each transfers image SHALL show:
- a header with "Cuentas del asado", today's date in long es-AR format (e.g. "15 de octubre de 2026"), and the title "Quién le transfiere a quién";
- one row per transfer in settlement order: the payer, an arrow and the receiver on the left (e.g. "Tito → Franco"), and the amount in whole pesos on the right in the Bitter display font;
- the mandatory footer (see "Every image carries the footer").
A transfers image is built only when there is at least one transfer.

#### Scenario: Reference asado transfers image
- **GIVEN** the reference asado on 15 October 2026
- **WHEN** the transfers image is built
- **THEN** its header reads "Cuentas del asado", "15 de octubre de 2026" and "Quién le transfiere a quién"
- **AND** its rows are, in order: "Tito → Franco $ 29.112", "Leo → Franco $ 29.112", "Mole → Franco $ 29.112", "El Negro → Franco $ 29.112", "El Pelado → Franco $ 29.112", "Bucky → Franco $ 5.336", "Bucky → Pica $ 12.888", "Bucky → El Aleman $ 10.888"
- **AND** its footer reads "powered by fjbalsamo"

#### Scenario: No transfers, no transfers image
- **GIVEN** only Franco with `500000`, or A and B each with `1000000`, or 3 participants all with `0`
- **WHEN** the images are built
- **THEN** no transfers image is built and only the contributions image exists

### Requirement: Contributions image content
Each contributions image SHALL show:
- a header with "Cuentas del asado", today's date in long es-AR format, the title "Cuánto puso cada uno", the line "Total {total} · Le toca a cada uno {share}", and, only when there is a rounding surplus, "Redondeado para arriba: sobran {surplus} para {name}.";
- one row per participant in insertion order with the name, "Puso {contribution}" and the balance as "Recibe {amount}", "Pone {amount}" or "Está al día";
- the mandatory footer (see "Every image carries the footer").

#### Scenario: Reference asado contributions image
- **GIVEN** the reference asado
- **WHEN** the contributions image is built
- **THEN** its header shows "Total $ 262.000 · Le toca a cada uno $ 29.112" and "Redondeado para arriba: sobran $ 8 para Franco."
- **AND** its first rows are "Franco · Puso $ 180.000 · Recibe $ 150.896", "Pica · Puso $ 42.000 · Recibe $ 12.888" and "El Aleman · Puso $ 40.000 · Recibe $ 10.888"
- **AND** its last row is "Bucky · Puso $ 0 · Pone $ 29.112"

#### Scenario: Non-divisible total
- **GIVEN** A with `1000` ($ 10), then B and C with `0`
- **WHEN** the contributions image is built
- **THEN** its header shows "Total $ 10 · Le toca a cada uno $ 4" and "Redondeado para arriba: sobran $ 2 para A."
- **AND** its rows are "A · Puso $ 10 · Recibe $ 8", "B · Puso $ 0 · Pone $ 4" and "C · Puso $ 0 · Pone $ 4"

#### Scenario: No rounding line without surplus
- **GIVEN** A and B each with `1000000`
- **WHEN** the contributions image is built
- **THEN** its header shows "Total $ 20.000 · Le toca a cada uno $ 10.000" and no "Redondeado" line
- **AND** both rows end with "Está al día"

#### Scenario: Zero total
- **GIVEN** 3 participants all with `0`
- **WHEN** the contributions image is built
- **THEN** its header shows "Total $ 0 · Le toca a cada uno $ 0" and every row ends with "Está al día"

### Requirement: Long lists are split into numbered pages
Each image SHALL hold at most 12 rows. When a list has more than 12 rows, the system SHALL produce as many pages as needed. Every page SHALL keep the full header and footer and add a page label "{page}/{pages}" right after the title on the same line (e.g. "Quién le transfiere a quién 1/2"). No row is ever omitted. Pages are numbered per image type, and file names carry the page number (`asado-transferencias-2.png`, `asado-aportes-2.png`). With a single page, no page label is shown.

#### Scenario: Fifteen participants
- **GIVEN** 15 participants where the first one paid for everyone, giving 14 transfers
- **WHEN** the images are built
- **THEN** there are 2 transfers pages with 12 and 2 rows and 2 contributions pages with 12 and 3 rows, each set labelled "1/2" and "2/2"

#### Scenario: Exactly twelve rows
- **GIVEN** 12 participants
- **WHEN** the contributions images are built
- **THEN** there is a single contributions page with 12 rows and no page label

### Requirement: Every image carries the footer
Every image SHALL end with the footer "powered by fjbalsamo". The text is exact and lowercase as written, centered horizontally at the bottom of the image, and drawn in the pizarra's muted chalk color. This applies to transfers and contributions images alike, and to **every page** of a paginated set. No other footer text SHALL be drawn.

#### Scenario: Footer on a single-page image
- **GIVEN** the reference asado
- **WHEN** the transfers and contributions images are built
- **THEN** each of the 2 images ends with "powered by fjbalsamo", centered at the bottom in the muted chalk color

#### Scenario: Footer on every page of a paginated set
- **GIVEN** 15 participants, so the transfers and the contributions are each split into pages "1/2" and "2/2"
- **WHEN** the images are built
- **THEN** each of the 4 pages ends with "powered by fjbalsamo", centered at the bottom in the muted chalk color
- **AND** no page shows "AsadoSplit" or any other footer text

### Requirement: Images are sharp, consistent and on-brand
Every image SHALL be 1080 px wide regardless of the phone's screen, with its height fitting its rows. It SHALL use the pizarra style: chalk text on the charcoal pizarra background, with the Bitter display font for headings and amounts. The Bitter font MUST be loaded before an image is drawn. A name too long to fit its row SHALL be shortened with "…" rather than overlapping other text.

#### Scenario: Same width on any phone
- **GIVEN** the reference asado on a phone with a device pixel ratio of 2 and on one with 3
- **WHEN** the images are built
- **THEN** every image is exactly 1080 px wide on both phones

#### Scenario: Long name
- **GIVEN** a participant named with 40 characters
- **WHEN** the contributions image is built
- **THEN** the name is shortened with "…" and does not overlap the amounts

### Requirement: Images are ready when the user taps
The system SHALL build both images in the background after the results change, so a tap on either image button can share without first waiting for drawing. If the user taps before the latest images of that button are ready, the system SHALL build them and then share or download them. A failure in that case SHALL show "No se pudo compartir. Probá de nuevo." below that button.

#### Scenario: Results changed just before tapping
- **GIVEN** the user just edited a contribution
- **WHEN** the user taps "Compartir aportes" right away
- **THEN** the shared image reflects the edited contribution
