export class FinanceTransactionNotLaunchedError extends Error {
  constructor() {
    super('Despesa não está lançada no principal')
    this.name = 'FinanceTransactionNotLaunchedError'
  }
}
