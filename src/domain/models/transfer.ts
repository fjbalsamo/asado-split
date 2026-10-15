/** A payment from one participant to another, in integer centavos (> 0). */
export interface Transfer {
  from: string
  to: string
  amount: number
}
