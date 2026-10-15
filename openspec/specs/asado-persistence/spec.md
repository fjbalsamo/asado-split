# asado-persistence Specification

## Purpose

Keeps the current asado on the device across reloads using only browser storage, never crashing on bad data, and lets the user start over.

## Requirements

### Requirement: Participants persist across reloads
The system SHALL save the participants (id, name, contribution, in insertion order) to localStorage after every change, together with a schema version. Only participants SHALL be stored; totals, shares, balances and transfers MUST always be recomputed. On load, the system SHALL restore the saved participants in the same order.

#### Scenario: Reload keeps the asado
- **GIVEN** the user added Franco ($ 180.000) and Pica ($ 42.000)
- **WHEN** the page is reloaded
- **THEN** Franco and Pica appear in the same order with the same contributions, and the transfers are the same as before

#### Scenario: First visit
- **GIVEN** nothing is stored
- **WHEN** the app loads
- **THEN** the asado starts with no participants

### Requirement: Invalid stored data never crashes the app
If the stored value is not valid JSON, has an unknown or missing schema version, has the wrong shape, contains a participant with an invalid name, a contribution that is negative, non-integer, not a safe integer or not a whole number of pesos (a multiple of 100 centavos), or contains duplicate ids or names (case-insensitive, trimmed), the system SHALL discard it, remove it from storage, and start with an empty asado without crashing. If storage is unavailable or writing fails, the app SHALL keep working in memory without any message.

#### Scenario: Corrupted JSON
- **GIVEN** the stored value is `{not json`
- **WHEN** the app loads
- **THEN** the asado starts with no participants and the app renders normally

#### Scenario: Unknown version
- **GIVEN** the stored value has version `99`
- **WHEN** the app loads
- **THEN** the asado starts with no participants

#### Scenario: Fractional contribution
- **GIVEN** a stored participant has contribution `10.5`
- **WHEN** the app loads
- **THEN** the asado starts with no participants

#### Scenario: Contribution with centavos
- **GIVEN** a stored participant has contribution `150050`
- **WHEN** the app loads
- **THEN** the asado starts with no participants and the recovery message is shown

#### Scenario: Storage throws
- **GIVEN** localStorage throws on access (e.g. private mode or quota exceeded)
- **WHEN** the user adds a participant
- **THEN** the participant appears and all amounts recalculate normally

### Requirement: The user is told when a saved asado could not be recovered
When stored data existed and was discarded as invalid, the system SHALL show the inline message "No pudimos recuperar el asado guardado. Empezamos uno nuevo." at the top of the participants section, announced politely to assistive tech. It MUST NOT use a modal or block interaction. The message SHALL have a close button labelled "Cerrar aviso". It SHALL disappear when the user closes it or adds the first participant. It SHALL NOT be shown when nothing was stored, when the saved asado loaded correctly, or when storage could not be accessed at all. Because the invalid data is removed, the message SHALL NOT appear again after a reload.

#### Scenario: Corrupted data shows the message
- **GIVEN** the stored value is `{not json`
- **WHEN** the app loads
- **THEN** the participants section shows "No pudimos recuperar el asado guardado. Empezamos uno nuevo." above the add form
- **AND** the add form is usable and no dialog is open

#### Scenario: Invalid participant shows the message
- **GIVEN** the stored value has version `1` and a participant with contribution `-500`
- **WHEN** the app loads
- **THEN** the message "No pudimos recuperar el asado guardado. Empezamos uno nuevo." is shown and the asado has no participants

#### Scenario: Closing the message
- **GIVEN** the recovery message is shown
- **WHEN** the user taps "Cerrar aviso"
- **THEN** the message is no longer shown

#### Scenario: Adding a participant hides the message
- **GIVEN** the recovery message is shown
- **WHEN** the user adds "Franco" with `180000`
- **THEN** the message is no longer shown and Franco is listed

#### Scenario: Not shown again after reload
- **GIVEN** the recovery message was shown for corrupted data
- **WHEN** the page is reloaded
- **THEN** no recovery message is shown and the asado is empty

#### Scenario: Silent on first visit and on valid data
- **GIVEN** nothing is stored, or the stored asado is valid
- **WHEN** the app loads
- **THEN** no recovery message is shown

#### Scenario: Silent when storage is inaccessible
- **GIVEN** reading localStorage throws
- **WHEN** the app loads
- **THEN** no recovery message is shown and the asado starts empty

### Requirement: Start a new asado with undo
The system SHALL offer "Empezar otro asado" when there is at least one participant. One tap SHALL immediately remove all participants and clear stored data, with no confirmation step and no modal. It SHALL then show a non-blocking snackbar at the bottom of the screen reading "Asado borrado", with a "Deshacer" action.
- "Deshacer" SHALL restore the previous participants exactly (same ids, names, contributions and order), save them again, and close the snackbar.
- The snackbar SHALL close on its own after 6 seconds. After that the reset is final and cannot be undone.
- Tapping elsewhere on the page SHALL NOT close the snackbar.
- Adding a participant while the snackbar is open SHALL close it and discard the undo, so restoring can never overwrite new data.

#### Scenario: Reset is immediate
- **GIVEN** the reference asado
- **WHEN** the user taps "Empezar otro asado"
- **THEN** the participants list is empty and the participants empty state is shown
- **AND** a snackbar shows "Asado borrado" with a "Deshacer" button

#### Scenario: Undo restores the asado
- **GIVEN** the user just reset the reference asado and the "Asado borrado" snackbar is open
- **WHEN** the user taps "Deshacer"
- **THEN** all 9 participants reappear in the original order with their contributions
- **AND** the transfers are again the 8 reference transfers
- **AND** the snackbar is closed
- **AND** after a reload the reference asado is still there

#### Scenario: Snackbar times out
- **GIVEN** the user just reset the reference asado and the "Asado borrado" snackbar is open
- **WHEN** 6 seconds pass without tapping "Deshacer"
- **THEN** the snackbar is no longer shown, the asado stays empty, and no "Deshacer" action is available
- **AND** after a reload the asado is still empty

#### Scenario: Tapping elsewhere does not dismiss
- **GIVEN** the "Asado borrado" snackbar is open
- **WHEN** the user taps the page header
- **THEN** the snackbar stays open

#### Scenario: Adding after reset discards the undo
- **GIVEN** the user just reset the reference asado and the snackbar is open
- **WHEN** the user adds "Franco" with `5000`
- **THEN** the snackbar closes and the asado contains only Franco

#### Scenario: Nothing to reset
- **GIVEN** there are no participants
- **WHEN** the page is shown
- **THEN** the "Empezar otro asado" button is not shown
