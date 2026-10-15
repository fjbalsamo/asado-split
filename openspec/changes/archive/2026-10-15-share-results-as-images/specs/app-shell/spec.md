# Spec Delta

## MODIFIED Requirements

### Requirement: Settlement section shows transfers and balances
The settlement section SHALL list the transfers in settlement order as "{payer} le transfiere {amount} a {receiver}". Right below the transfers it SHALL show the "Compartir transferencias" button when there is at least one transfer. Below that, it SHALL list each participant's balance in insertion order as "Recibe {amount}" (positive), "Pone {amount}" (negative) or "Está al día" (zero), followed right below by the "Compartir aportes" button and, last, the quiet "Compartir como texto" action. Each share action has its own status message right below it. The meaning MUST NOT rely on color alone.

#### Scenario: Reference asado settlement
- **GIVEN** the reference asado
- **WHEN** the page renders
- **THEN** the first transfer reads "Tito le transfiere $ 29.112 a Franco"
- **AND** Franco's balance reads "Recibe $ 150.896" and Bucky's reads "Pone $ 29.112"

#### Scenario: Share actions follow the lists they share (xs)
- **GIVEN** the reference asado on a 360 px wide viewport
- **WHEN** the page renders
- **THEN** the settlement section shows, top to bottom: the transfers list, "Compartir transferencias", "Cómo quedó cada uno" with the balances, "Compartir aportes", then "Compartir como texto"

#### Scenario: No transfers
- **GIVEN** A and B each contributing `1000000`
- **WHEN** the page renders
- **THEN** the settlement section shows "Nadie le debe nada a nadie.", no "Compartir transferencias" button, and the balances followed by "Compartir aportes" and "Compartir como texto"
