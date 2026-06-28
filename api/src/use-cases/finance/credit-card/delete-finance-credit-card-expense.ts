import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'

interface DeleteFinanceCreditCardExpenseInput {
  userId: string
  expenseId: string
}

export class DeleteFinanceCreditCardExpenseUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  ) {}

  async execute({ userId, expenseId }: DeleteFinanceCreditCardExpenseInput): Promise<void> {
    try {
      await this.financeCreditCardExpensesRepository.delete(expenseId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
