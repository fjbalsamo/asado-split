# Spec Delta

## Purpose

Produces a short, deterministic list of "who transfers how much to whom" that settles every participant's balance exactly, in whole pesos.

## ADDED Requirements

### Requirement: Transfers settle every balance exactly
The system SHALL produce a list of transfers. Each has a payer, a receiver and a positive amount in centavos that is a whole number of pesos. Payers SHALL have negative balances and receivers positive ones. After applying all transfers, every participant's balance MUST be exactly `0`. No participant SHALL transfer to themselves. There SHALL be at most `(payers + receivers − 1)` transfers.

#### Scenario: Non-divisible single payer
- **GIVEN** balances A `+800`, B `-400`, C `-400` (insertion order A, B, C)
- **WHEN** transfers are computed
- **THEN** the transfers are, in order: B → A `400` ($ 4); C → A `400` ($ 4)

#### Scenario: Surplus tie
- **GIVEN** balances A `+300`, B `+100`, C `-400` (insertion order A, B, C)
- **WHEN** transfers are computed
- **THEN** the transfers are, in order: C → A `300` ($ 3); C → B `100` ($ 1)

#### Scenario: No participants
- **GIVEN** there are no participants
- **WHEN** transfers are computed
- **THEN** the list is empty

#### Scenario: One participant
- **GIVEN** a single participant
- **WHEN** transfers are computed
- **THEN** the list is empty

#### Scenario: Equal contributions
- **GIVEN** all balances are `0`
- **WHEN** transfers are computed
- **THEN** the list is empty

#### Scenario: Zero total
- **GIVEN** 3 participants all contributing `0`
- **WHEN** transfers are computed
- **THEN** the list is empty

### Requirement: Transfers are deterministic and compensate debts greedily
The system SHALL compute transfers greedily. Payers are ordered by the amount they owe and receivers by the amount owed to them, largest first, with ties broken by insertion order. Each step pairs the current payer with the current receiver for the smaller of the two remaining amounts, then moves on from whichever is settled. The same participants and contributions MUST always produce the same transfers in the same order. The system makes no claim that the number of transfers is minimal.

#### Scenario: Reference asado transfers
- **GIVEN** the reference asado (Franco `18000000`, Pica `4200000`, El Aleman `4000000`, then Tito, Leo, Mole, El Negro, El Pelado, Bucky at `0`)
- **WHEN** transfers are computed
- **THEN** the transfers are, in order:
  - Tito → Franco `2911200` ($ 29.112)
  - Leo → Franco `2911200` ($ 29.112)
  - Mole → Franco `2911200` ($ 29.112)
  - El Negro → Franco `2911200` ($ 29.112)
  - El Pelado → Franco `2911200` ($ 29.112)
  - Bucky → Franco `533600` ($ 5.336)
  - Bucky → Pica `1288800` ($ 12.888)
  - Bucky → El Aleman `1088800` ($ 10.888)
- **AND** only participants who contributed `0` pay, and Pica and El Aleman only receive

#### Scenario: Same input, same output
- **GIVEN** the reference asado
- **WHEN** transfers are computed twice
- **THEN** both results are identical, including order

#### Scenario: One receiver, two payers, one even participant
- **GIVEN** A contributes `3000`, B contributes `0`, C contributes `0` and D contributes `1000` (insertion order A, B, C, D; share `1000` each, no surplus)
- **WHEN** transfers are computed
- **THEN** the transfers are, in order: B → A `1000`; C → A `1000`
