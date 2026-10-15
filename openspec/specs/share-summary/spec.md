# share-summary Specification

## Purpose

Lets the user send the asado's result to the group chat as plain text that reads well in WhatsApp, using the phone's native share sheet or the clipboard.

## Requirements

### Requirement: Share text is plain, WhatsApp-friendly and complete
The system SHALL build a plain-text summary (no markup, one item per line) with amounts formatted per the `money` capability:

```
Cuentas del asado
Total: {total} entre {n} personas
Le toca a cada uno: {share}
{surplus line, only when there is a surplus}
{transfers block}
```

- When the share was rounded up and there is a surplus, the line after the share SHALL read `Redondeado para arriba: sobran {surplus} para {recipient}.`; with no surplus that line SHALL be omitted.
- The transfers block SHALL start with the line `Transferencias:` followed by one line per transfer, in settlement order: `• {payer} → {receiver}: {amount}`.
- With no transfers, the transfers block SHALL be the single line `Nadie le debe nada a nadie.`
- With exactly one participant, the total line SHALL read `Total: {total} entre 1 persona`.

#### Scenario: Reference asado text
- **GIVEN** the reference asado
- **WHEN** the share text is built
- **THEN** it is exactly:
```
Cuentas del asado
Total: $ 262.000 entre 9 personas
Le toca a cada uno: $ 29.112
Redondeado para arriba: sobran $ 8 para Franco.
Transferencias:
• Tito → Franco: $ 29.112
• Leo → Franco: $ 29.112
• Mole → Franco: $ 29.112
• El Negro → Franco: $ 29.112
• El Pelado → Franco: $ 29.112
• Bucky → Franco: $ 5.336
• Bucky → Pica: $ 12.888
• Bucky → El Aleman: $ 10.888
```

#### Scenario: Equal contributions
- **GIVEN** A and B each contributing `1000000`
- **WHEN** the share text is built
- **THEN** it is exactly:
```
Cuentas del asado
Total: $ 20.000 entre 2 personas
Le toca a cada uno: $ 10.000
Nadie le debe nada a nadie.
```

#### Scenario: One participant
- **GIVEN** only Franco contributing `500000`
- **WHEN** the share text is built
- **THEN** the second line is `Total: $ 5.000 entre 1 persona`

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
