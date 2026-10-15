# Spec Delta

## Purpose

Turns peso amounts typed by Argentine users into exact whole-peso values held as integer centavos, and renders them back as es-AR currency text without decimals, so no money is ever handled as floating point.

## ADDED Requirements

### Requirement: Amounts are whole pesos held as integer centavos
The system SHALL represent every monetary amount as an integer number of centavos that satisfies `Number.isSafeInteger`. Every contribution, share, balance and transfer SHALL be a whole number of pesos, so every value is a multiple of `100` centavos. The system MUST NOT store or compute money as fractional numbers.

#### Scenario: Whole pesos become centavos
- **GIVEN** a user types `42000` as an amount
- **WHEN** the amount is parsed
- **THEN** the stored value is exactly `4200000` centavos

### Requirement: Amount input accepts whole pesos in es-AR notation
The system SHALL accept amounts written with digits and optional `.` thousands separators in valid 3-digit groups. A trailing zero-centavos suffix (`,0`, `,00`, `.0` or `.00`) SHALL be accepted and ignored, since it does not change the whole-peso value. Spaces anywhere (including the non-breaking space the app itself displays) and a leading `$` SHALL be ignored. An empty amount SHALL count as `0` centavos.

#### Scenario: Plain digits
- **GIVEN** a user types `180000`
- **WHEN** the amount is parsed
- **THEN** the value is `18000000` centavos

#### Scenario: Thousands separators
- **GIVEN** a user types `180.000`
- **WHEN** the amount is parsed
- **THEN** the value is `18000000` centavos

#### Scenario: Currency sign and spaces
- **GIVEN** a user types `$ 15.000`
- **WHEN** the amount is parsed
- **THEN** the value is `1500000` centavos

#### Scenario: Zero centavos after a comma are accepted
- **GIVEN** a user types `1.500,00`
- **WHEN** the amount is parsed
- **THEN** the value is `150000` centavos ($ 1.500) and no error is shown

#### Scenario: Zero centavos after a dot are accepted
- **GIVEN** a user types `1500.00`
- **WHEN** the amount is parsed
- **THEN** the value is `150000` centavos ($ 1.500)

#### Scenario: Formatted value is accepted back
- **GIVEN** an amount field contains `$ 1.500` as displayed by the app (with its non-breaking space)
- **WHEN** the amount is parsed
- **THEN** the value is `150000` centavos

#### Scenario: Empty amount
- **GIVEN** a user leaves the amount empty
- **WHEN** the amount is parsed
- **THEN** the value is `0` centavos

### Requirement: Amount fields show their interpretation on blur
When an amount field loses focus and its content is a valid amount, the system SHALL replace the content with that amount formatted per the display requirement (for example `$ 1.500`), so the user sees how the input was read. An empty field SHALL stay empty. An invalid value SHALL stay as typed, with its error message shown.

#### Scenario: Plain digits are reformatted
- **GIVEN** the user types `1500` in "Cuánto puso"
- **WHEN** the field loses focus
- **THEN** the field shows `$ 1.500` and the value is `150000` centavos

#### Scenario: Thousands with dot are reformatted
- **GIVEN** the user types `1.500` in "Cuánto puso"
- **WHEN** the field loses focus
- **THEN** the field shows `$ 1.500` and the value is `150000` centavos

#### Scenario: Zero centavos are dropped on blur
- **GIVEN** the user types `1.500,00` in "Cuánto puso"
- **WHEN** the field loses focus
- **THEN** the field shows `$ 1.500` and no error is shown

#### Scenario: Large amount is reformatted
- **GIVEN** the user types `180000` in "Cuánto puso"
- **WHEN** the field loses focus
- **THEN** the field shows `$ 180.000`

#### Scenario: Empty stays empty
- **GIVEN** "Cuánto puso" is empty
- **WHEN** the field loses focus
- **THEN** the field stays empty and no error is shown

#### Scenario: Amount with centavos stays as typed
- **GIVEN** the user types `1500,50` in "Cuánto puso"
- **WHEN** the field loses focus
- **THEN** the field still shows `1500,50` and shows "Poné el monto sin centavos."

### Requirement: Invalid amounts are rejected with es-AR messages
The system SHALL reject an amount and show the matching message inline under the field:
- any **non-zero** decimal part, written after `,` (such as `1500,50`, `1500,5` or `1.500,05`) or as a `.` followed by 1 or 2 digits (such as `1500.75`): "Poné el monto sin centavos." A zero-centavos suffix is accepted (see above).
- a negative amount: "El monto no puede ser negativo."
- more than `10000000000` centavos ($ 100.000.000): "El monto no puede superar los $ 100.000.000."
- anything else that is not a whole number in the accepted notation (such as `mucho`, `1.5000` or `1,2,3`): "Ingresá un monto válido, por ejemplo 15000."

#### Scenario: Centavos after a comma
- **GIVEN** a user types `1500,50`
- **WHEN** the form is validated
- **THEN** the field shows "Poné el monto sin centavos."

#### Scenario: Centavos after a dot
- **GIVEN** a user types `1500.75`
- **WHEN** the form is validated
- **THEN** the field shows "Poné el monto sin centavos."

#### Scenario: Non-zero centavos after thousands are rejected
- **GIVEN** a user types `1.500,05`
- **WHEN** the form is validated
- **THEN** the field shows "Poné el monto sin centavos."

#### Scenario: Letters
- **GIVEN** a user types `mucho`
- **WHEN** the form is validated
- **THEN** the field shows "Ingresá un monto válido, por ejemplo 15000."

#### Scenario: Negative
- **GIVEN** a user types `-500`
- **WHEN** the form is validated
- **THEN** the field shows "El monto no puede ser negativo."

#### Scenario: Above the maximum
- **GIVEN** a user types `100.000.001`
- **WHEN** the form is validated
- **THEN** the field shows "El monto no puede superar los $ 100.000.000."

#### Scenario: Exactly the maximum
- **GIVEN** a user types `100.000.000`
- **WHEN** the form is validated
- **THEN** no error is shown and the value is `10000000000` centavos

### Requirement: Amounts are displayed in es-AR pesos without decimals
The system SHALL display every amount (contributions, total, share, surplus, balances, transfers, shared text) as es-AR ARS currency with no decimal part, as produced by `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 })`. In this spec, the space after `$` stands for the non-breaking space that formatter emits.

#### Scenario: Large amount
- **GIVEN** an amount of `15089600` centavos
- **WHEN** it is displayed
- **THEN** it reads `$ 150.896`

#### Scenario: Zero
- **GIVEN** an amount of `0` centavos
- **WHEN** it is displayed
- **THEN** it reads `$ 0`

#### Scenario: Small surplus
- **GIVEN** an amount of `800` centavos
- **WHEN** it is displayed
- **THEN** it reads `$ 8`
