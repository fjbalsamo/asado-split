/** Net position in integer centavos: > 0 receives, < 0 pays, 0 is even. */
export interface Balance {
  participantId: string
  amount: number
}
