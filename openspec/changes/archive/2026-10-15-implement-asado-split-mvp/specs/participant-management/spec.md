# Spec Delta

## Purpose

Lets the user build the list of people at the asado and what each one put in, editing it inline on a phone with immediate recalculation and clear es-AR validation.

## ADDED Requirements

### Requirement: Add a participant
The system SHALL let the user add a participant with a name and a contribution ("Cuánto puso") from an always-visible form on the main page. On a valid submit, the participant is appended at the end of the list, all totals, shares, balances and transfers update immediately, the form clears and focus returns to the name field.

#### Scenario: Add with whole-peso contribution
- **GIVEN** an empty asado on a phone (xs)
- **WHEN** the user types "Franco" as name and `180000` as contribution and taps "Agregar"
- **THEN** Franco appears in the list with $ 180.000
- **AND** the total shows $ 180.000
- **AND** the name field is empty and focused

#### Scenario: Add with empty contribution
- **GIVEN** an asado with Franco
- **WHEN** the user types "Tito", leaves the contribution empty and taps "Agregar"
- **THEN** Tito appears in the list with $ 0

#### Scenario: Submit with keyboard
- **GIVEN** the name and contribution fields are filled with valid values
- **WHEN** the user presses Enter in either field
- **THEN** the participant is added as if "Agregar" had been tapped

### Requirement: Participant names are required, short and unique
Names SHALL be trimmed before validation and storage. The system SHALL reject, with an inline message under the name field:
- an empty or whitespace-only name: "Ingresá un nombre."
- a name longer than 40 characters after trimming: "Usá hasta 40 caracteres."
- a name equal to another participant's name, ignoring case and surrounding spaces: "Ya hay alguien que se llama así."

#### Scenario: Empty name
- **GIVEN** the add form
- **WHEN** the user taps "Agregar" with the name "   "
- **THEN** the name field shows "Ingresá un nombre." and nothing is added

#### Scenario: Duplicate name, different case and spaces
- **GIVEN** an asado with "Pica"
- **WHEN** the user tries to add " pica "
- **THEN** the name field shows "Ya hay alguien que se llama así." and nothing is added

#### Scenario: Name too long
- **GIVEN** the add form
- **WHEN** the user submits a 41-character name
- **THEN** the name field shows "Usá hasta 40 caracteres."

#### Scenario: Name is trimmed
- **GIVEN** the add form
- **WHEN** the user adds "  El Aleman  "
- **THEN** the list shows "El Aleman"

### Requirement: Contribution validation
The contribution field SHALL follow the money input rules (see `money` capability) and show those es-AR messages inline. The field SHALL open a numeric keypad on phones (`inputMode="numeric"`; amounts are whole pesos), and SHALL reformat its value on blur as described in the `money` capability.

#### Scenario: Centavos block submit
- **GIVEN** the add form with name "Mole"
- **WHEN** the user submits `1500,50` as contribution
- **THEN** the contribution field shows "Poné el monto sin centavos." and nothing is added

#### Scenario: Invalid contribution blocks submit
- **GIVEN** the add form with name "Mole"
- **WHEN** the user submits `-100` as contribution
- **THEN** the contribution field shows "El monto no puede ser negativo." and nothing is added

### Requirement: Edit a participant inline
The system SHALL let the user edit a participant's name and contribution in place within the list, without a modal or new screen. Only one participant SHALL be in edit mode at a time. "Guardar" applies the change and recalculates immediately; "Cancelar" discards it. Editing MUST NOT change the participant's position in the list. Uniqueness ignores the participant being edited.

#### Scenario: Edit contribution
- **GIVEN** Pica with $ 42.000
- **WHEN** the user taps edit on Pica ("Editar a Pica"), sees the contribution field prefilled with `$ 42.000`, changes it to `45000` and taps "Guardar"
- **THEN** Pica shows $ 45.000, the total and transfers update, and Pica keeps their position

#### Scenario: Keep own name while editing
- **GIVEN** Pica in edit mode
- **WHEN** the user saves without changing the name "Pica"
- **THEN** no duplicate-name error is shown

#### Scenario: Rename to existing name
- **GIVEN** an asado with Pica and Franco, Pica in edit mode
- **WHEN** the user renames Pica to "franco" and taps "Guardar"
- **THEN** the name field shows "Ya hay alguien que se llama así." and nothing changes

#### Scenario: Cancel edit
- **GIVEN** Pica in edit mode with a changed contribution
- **WHEN** the user taps "Cancelar"
- **THEN** Pica keeps the original contribution

### Requirement: Remove a participant
The system SHALL let the user remove a participant with one tap on a remove button labelled for assistive tech as "Sacar a {name}". Removal recalculates immediately. The remaining participants keep their relative order.

#### Scenario: Remove a participant
- **GIVEN** the reference asado
- **WHEN** the user taps "Sacar a Bucky"
- **THEN** Bucky disappears from the list
- **AND** with 8 participants and total `26200000`, each share is `3275000` ($ 32.750) with no surplus

#### Scenario: Remove the last participant
- **GIVEN** an asado with only Franco
- **WHEN** the user removes Franco
- **THEN** the participants empty state is shown

### Requirement: Updates and removals of unknown participants are ignored
Updating or removing a participant whose id is not in the list (for example, a second tap on "Sacar a {name}" arriving after the first already removed them) SHALL leave the participant list unchanged, SHALL NOT raise an error, and SHALL NOT crash the app.

#### Scenario: Remove with a non-existent id
- **GIVEN** an asado with Franco and Pica, where no participant has id `ghost`
- **WHEN** a removal for id `ghost` is applied
- **THEN** the list still contains Franco and Pica in the same order with the same contributions
- **AND** no error is raised

#### Scenario: Double tap on remove
- **GIVEN** an asado with Franco and Pica
- **WHEN** the user taps "Sacar a Pica" twice in quick succession
- **THEN** only Pica is removed, Franco remains, and no error is shown

#### Scenario: Update with a non-existent id
- **GIVEN** an asado with Franco and Pica, where no participant has id `ghost`
- **WHEN** an update for id `ghost` with name "Mole" and contribution `100000` is applied
- **THEN** the list still contains Franco and Pica unchanged, no "Mole" is added
- **AND** no error is raised

### Requirement: Invalid changes are blocked in the form and never crash the asado
The add and edit forms SHALL validate every change against the current participant list before submitting, and show the es-AR messages defined above inline. A change that is invalid anyway when it reaches the asado (for example a duplicate name, an empty or too-long name, or a negative contribution or one that is not a whole number of pesos) SHALL be ignored: the participant list stays unchanged, no error is raised, and the app keeps working.

#### Scenario: Duplicate name is stopped by the form
- **GIVEN** an asado with Pica
- **WHEN** the user types "PICA" in the add form and taps "Agregar"
- **THEN** the name field shows "Ya hay alguien que se llama así." and the add is never sent to the asado

#### Scenario: Duplicate name that bypasses the form is ignored
- **GIVEN** an asado with Pica
- **WHEN** an add for name " pica " with contribution `0` reaches the asado directly
- **THEN** the list still contains only the original Pica, no error is raised and the app keeps working

#### Scenario: Rename to an existing name that bypasses the form is ignored
- **GIVEN** an asado with Franco and Pica
- **WHEN** an update renaming Pica to "franco" reaches the asado directly
- **THEN** Pica keeps the name "Pica" and no error is raised

#### Scenario: Contribution with centavos that bypasses the form is ignored
- **GIVEN** an asado with Franco
- **WHEN** an add for "Mole" with contribution `150050` (not a whole number of pesos) reaches the asado directly
- **THEN** the list still contains only Franco and no error is raised

#### Scenario: Invalid contribution that bypasses the form is ignored
- **GIVEN** an asado with Franco
- **WHEN** an add for "Mole" with contribution `-100` reaches the asado directly
- **THEN** the list still contains only Franco and no error is raised
