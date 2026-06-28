export class FinanceTransactionLimitExceededError extends Error {
  constructor() {
    super('Limite de transações atingido (500)')
    this.name = 'FinanceTransactionLimitExceededError'
  }
}
