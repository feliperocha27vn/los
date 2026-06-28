export class FinanceTransactionAlreadyLaunchedError extends Error {
  constructor() {
    super('Despesa já lançada no principal')
    this.name = 'FinanceTransactionAlreadyLaunchedError'
  }
}
