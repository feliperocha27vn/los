import { FinanceTransactionNotLaunchedError } from '@errors/finance-transaction-not-launched-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'

interface UnlaunchFinanceCreditCardExpenseInput {
  userId: string
  expenseId: string
}

interface UnlaunchFinanceCreditCardExpenseOutput {
  expense: Awaited<ReturnType<FinanceCreditCardExpensesRepository['markUnlaunched']>>
}

export class UnlaunchFinanceCreditCardExpenseUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
  ) {}

  async execute({
    userId,
    expenseId,
  }: UnlaunchFinanceCreditCardExpenseInput): Promise<UnlaunchFinanceCreditCardExpenseOutput> {
    const expense = await this.financeCreditCardExpensesRepository.findById(expenseId, userId)
    if (!expense) throw new ResourceNotFoundError()
    if (!expense.launchedInMain) {
      throw new FinanceTransactionNotLaunchedError()
    }

    if (expense.linkedTransactionId) {
      try {
        await this.financeTransactionsRepository.delete(expense.linkedTransactionId, userId)
      } catch {
        // already deleted elsewhere — continue
      }
    }

    const updatedExpense = await this.financeCreditCardExpensesRepository.markUnlaunched(
      expenseId,
      userId,
    )

    return { expense: updatedExpense }
  }
}
