# Spec Delta

## MODIFIED Requirements

### Requirement: Share via native sheet, fall back to clipboard
A secondary text action "Compartir como texto" SHALL be shown at the end of the settlement section, below "Compartir aportes", when there is at least one participant. It is styled as a quiet link-like button, not a primary button. Tapping it SHALL open the device's native share sheet with the summary text when available. If native sharing is unavailable or fails for a reason other than the user cancelling, the system SHALL copy the text to the clipboard instead. The outcome SHALL be announced in its own polite live region right below "Compartir como texto", independent of the image buttons' messages, and cleared after 4 seconds:
- shared: "Listo, compartido."
- copied: "Copiado. Pegalo en el grupo."
- neither worked: "No se pudo compartir. Probá de nuevo."
If the user cancels the native share sheet, no message SHALL be shown.

#### Scenario: Native share available
- **GIVEN** a phone browser with native sharing and the reference asado
- **WHEN** the user taps "Compartir como texto" and picks WhatsApp
- **THEN** the share sheet receives the reference asado text
- **AND** "Listo, compartido." is shown

#### Scenario: Clipboard fallback
- **GIVEN** a browser without native sharing but with clipboard access
- **WHEN** the user taps "Compartir como texto"
- **THEN** the summary text is copied to the clipboard and "Copiado. Pegalo en el grupo." is shown

#### Scenario: User cancels the share sheet
- **GIVEN** native sharing is available
- **WHEN** the user dismisses the share sheet
- **THEN** no message is shown and nothing is copied

#### Scenario: Cancelling clears a previous message instead of showing an error
- **GIVEN** native sharing is available and "Copiado. Pegalo en el grupo." is shown from an earlier share
- **WHEN** the user taps "Compartir como texto" again and dismisses the share sheet (the browser reports an `AbortError`)
- **THEN** no message is shown, "No se pudo compartir. Probá de nuevo." is not shown, and nothing is copied

#### Scenario: Nothing works
- **GIVEN** native sharing and clipboard are both unavailable or fail
- **WHEN** the user taps "Compartir como texto"
- **THEN** "No se pudo compartir. Probá de nuevo." is shown

#### Scenario: Message clears
- **GIVEN** "Copiado. Pegalo en el grupo." is shown
- **WHEN** 4 seconds pass
- **THEN** the message is no longer shown

#### Scenario: No participants
- **GIVEN** there are no participants
- **WHEN** the page is shown
- **THEN** the "Compartir como texto" action is not shown
