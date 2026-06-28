export class FinanceCreditCardLimitExceededError extends Error {
  constructor() {
    super('Limite de despesas no cartão atingido (200)')
    this.name = 'FinanceCreditCardLimitExceededError'
  }
}
