/**
 * The equal split, in integer centavos (whole pesos). Everyone's share is the same: the total
 * divided by the number of participants, rounded up to a whole peso. The rounding surplus
 * (n × share − total) goes to `surplusRecipientId`, or to nobody when it is 0.
 */
export interface SplitSummary {
  share: number
  surplus: number
  surplusRecipientId: string | null
}
