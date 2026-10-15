# Spec Delta

## Purpose

Defines the single, phone-first page that holds the whole flow (participants, summary, settlement), its empty states, and the accessibility baseline every part of the UI must meet.

## ADDED Requirements

### Requirement: Single page, single column on phones
The system SHALL present the whole flow on one page with no routing, modals, dialogs or extra screens (a non-blocking snackbar for undo is allowed), in this top-to-bottom order: header, participants ("Quiénes vinieron") with the add form and list, summary ("Las cuentas"), settlement ("Quién le transfiere a quién") with the share button, and the reset button. On xs viewports the layout SHALL be a single column without horizontal scrolling. On larger viewports the content SHALL stay a single centered column with a readable maximum width.

#### Scenario: Phone layout
- **GIVEN** a 360 px wide viewport with the reference asado
- **WHEN** the page renders
- **THEN** all sections are stacked in one column in the order above and the page has no horizontal scroll

#### Scenario: Desktop layout
- **GIVEN** a 1280 px wide viewport
- **WHEN** the page renders
- **THEN** the same single column is centered with a limited width

### Requirement: Summary shows total, people and per-person share
The summary SHALL show the total, the number of participants and the single per-person share. When the share was rounded up and there is a surplus, it SHALL add one secondary line: "Redondeado para arriba: sobran {surplus} para {recipient}." With no surplus that line SHALL NOT be shown. It SHALL update immediately on any change.

#### Scenario: Reference asado summary
- **GIVEN** the reference asado
- **WHEN** the page renders
- **THEN** the summary shows total $ 262.000, 9 personas, and per person $ 29.112
- **AND** a secondary line reads "Redondeado para arriba: sobran $ 8 para Franco."

#### Scenario: Divisible summary
- **GIVEN** A and B each contributing `1000000`
- **WHEN** the page renders
- **THEN** the summary shows total $ 20.000, 2 personas and per person $ 10.000
- **AND** no rounding line is shown

### Requirement: Settlement section shows transfers and balances
The settlement section SHALL list the transfers in settlement order as "{payer} le transfiere {amount} a {receiver}". Below, it SHALL list each participant's balance in insertion order as "Recibe {amount}" (positive), "Pone {amount}" (negative) or "Está al día" (zero). The meaning MUST NOT rely on color alone.

#### Scenario: Reference asado settlement
- **GIVEN** the reference asado
- **WHEN** the page renders
- **THEN** the first transfer reads "Tito le transfiere $ 29.112 a Franco"
- **AND** Franco's balance reads "Recibe $ 150.896" and Bucky's reads "Pone $ 29.112"

### Requirement: Clear empty states
The system SHALL show helpful empty states instead of empty lists or zero-only screens:
- no participants: the participants section shows "Todavía no hay nadie. Agregá a alguien para arrancar." and the summary and settlement sections are not shown;
- participants but no transfers needed (one participant, zero total or equal contributions): the settlement section shows "Nadie le debe nada a nadie."

#### Scenario: No participants
- **GIVEN** a first visit
- **WHEN** the page renders
- **THEN** the add form and "Todavía no hay nadie. Agregá a alguien para arrancar." are shown, and no summary, transfers, share or reset button are shown

#### Scenario: One participant
- **GIVEN** only Franco with $ 5.000
- **WHEN** the page renders
- **THEN** the summary shows total $ 5.000, 1 persona, per person $ 5.000
- **AND** the settlement section shows "Nadie le debe nada a nadie."

#### Scenario: Zero total
- **GIVEN** 3 participants all with $ 0
- **WHEN** the page renders
- **THEN** the summary shows total $ 0 and the settlement section shows "Nadie le debe nada a nadie."

### Requirement: Accessible, touch-friendly interface
Every interactive element SHALL have a touch target of at least 48×48 CSS px, an accessible name in es-AR, and a clearly visible keyboard focus indicator. Text and essential UI elements SHALL meet WCAG 2.1 AA contrast (4.5:1 for body text, 3:1 for large text and UI components). Amount fields SHALL request a numeric keypad on phones (`inputMode="numeric"`), since amounts are whole pesos. Icon-only buttons SHALL have labels such as "Editar a {name}" and "Sacar a {name}". User-facing copy SHALL be es-AR with voseo and sentence case.

#### Scenario: Keyboard focus
- **GIVEN** the page with participants
- **WHEN** the user moves through controls with Tab
- **THEN** every control shows a visible focus indicator and is reachable in visual order

#### Scenario: Icon button names
- **GIVEN** a participant named Pica
- **WHEN** a screen reader reads Pica's row
- **THEN** the buttons are announced as "Editar a Pica" and "Sacar a Pica"
