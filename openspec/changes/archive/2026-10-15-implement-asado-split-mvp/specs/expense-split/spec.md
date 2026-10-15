# Spec Delta

## Purpose

Computes how much the asado cost in total, the equal per-person share rounded up to whole pesos, who keeps the rounding surplus, and each participant's resulting balance, conserving money exactly.

## ADDED Requirements

### Requirement: Total is the sum of contributions
The system SHALL compute the total as the exact sum of all participants' contributions in centavos.

#### Scenario: No participants
- **GIVEN** there are no participants
- **WHEN** the total is computed
- **THEN** the total is `0` centavos

#### Scenario: Reference asado total
- **GIVEN** the reference asado: Franco `18000000`, Pica `4200000`, El Aleman `4000000`, and Tito, Leo, Mole, El Negro, El Pelado, Bucky with `0` each, added in that order
- **WHEN** the total is computed
- **THEN** the total is `26200000` centavos ($ 262.000)

### Requirement: Equal share rounded up to whole pesos
The system SHALL give every participant the same share: the total in pesos divided by the number of participants, rounded **up** to a whole peso (`share = ceil(total / n)` in pesos). The surplus SHALL be `n × share − total`. It is always between `0` and `n − 1` pesos. With no participants there is no share and no surplus.

#### Scenario: Reference asado share
- **GIVEN** the reference asado
- **WHEN** the share is computed
- **THEN** every participant's share is `2911200` centavos ($ 29.112)
- **AND** the shares sum to `26200800` and the surplus is `800` centavos ($ 8)

#### Scenario: Non-divisible total
- **GIVEN** A contributes `1000` ($ 10) and B and C contribute `0`, added in that order
- **WHEN** the share is computed
- **THEN** every share is `400` ($ 4) and the surplus is `200` ($ 2)

#### Scenario: Divisible total
- **GIVEN** 4 participants with a total of `4000000` centavos
- **WHEN** the share is computed
- **THEN** every share is `1000000` and the surplus is `0`

#### Scenario: Zero total
- **GIVEN** 3 participants, all contributing `0`
- **WHEN** the share is computed
- **THEN** every share is `0` and the surplus is `0`

#### Scenario: One participant
- **GIVEN** a single participant contributing `500000`
- **WHEN** the share is computed
- **THEN** their share is `500000` and the surplus is `0`

#### Scenario: No participants
- **GIVEN** there are no participants
- **WHEN** the share is computed
- **THEN** the share is `0`, the surplus is `0`, and no error occurs

### Requirement: The surplus goes to the top contributor
When the surplus is greater than `0`, the system SHALL assign all of it to the participant with the highest contribution. Ties SHALL be broken by insertion order: the one added first wins. When the surplus is `0` there is no surplus recipient.

#### Scenario: Reference asado surplus
- **GIVEN** the reference asado
- **WHEN** the surplus recipient is determined
- **THEN** Franco receives the `800` centavos ($ 8) surplus

#### Scenario: Highest contribution wins over insertion order
- **GIVEN** Zoe contributes `100` ($ 1) and then Ana contributes `200` ($ 2)
- **WHEN** the split is computed
- **THEN** the share is `200` ($ 2), the surplus is `100` ($ 1), and Ana receives it

#### Scenario: Tie on the highest contribution
- **GIVEN** A contributes `500` ($ 5), B contributes `500` ($ 5) and C contributes `0`, added in that order
- **WHEN** the split is computed
- **THEN** the share is `400` ($ 4), the surplus is `200` ($ 2), and A receives it

#### Scenario: No surplus, no recipient
- **GIVEN** 4 participants with a total of `4000000` centavos
- **WHEN** the split is computed
- **THEN** there is no surplus recipient

### Requirement: Balances conserve money exactly
The system SHALL compute each participant's balance as `contribution − share`, plus the surplus for the surplus recipient, listed in insertion order. A positive balance means the participant receives money, a negative balance means they pay, and zero means they are even. The sum of all balances MUST be exactly `0`. The sum of all shares minus the surplus MUST equal the total.

#### Scenario: Reference asado balances
- **GIVEN** the reference asado
- **WHEN** balances are computed
- **THEN** Franco's balance is `+15089600` ($ 150.896)
- **AND** Pica's balance is `+1288800` ($ 12.888)
- **AND** El Aleman's balance is `+1088800` ($ 10.888)
- **AND** Tito, Leo, Mole, El Negro, El Pelado and Bucky each have `-2911200` ($ 29.112)
- **AND** the balances sum to `0`

#### Scenario: Non-divisible single payer
- **GIVEN** A contributes `1000` and B and C contribute `0`, added in that order
- **WHEN** balances are computed
- **THEN** A's balance is `+800`, B's is `-400` and C's is `-400`

#### Scenario: Tie keeps the surplus with the first top contributor
- **GIVEN** A contributes `500`, B contributes `500` and C contributes `0`, added in that order
- **WHEN** balances are computed
- **THEN** A's balance is `+300`, B's is `+100` and C's is `-400`

#### Scenario: Equal contributions
- **GIVEN** 3 participants each contributing `1000000`
- **WHEN** balances are computed
- **THEN** every balance is `0`

#### Scenario: One participant
- **GIVEN** a single participant contributing `500000`
- **WHEN** balances are computed
- **THEN** their balance is `0`
