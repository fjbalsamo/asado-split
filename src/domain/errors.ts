/** Thrown when a domain invariant is violated. Signals a programming error, not user input. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
