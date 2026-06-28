import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'

interface GetFinanceCreditCardExpenseDetailInput {
  userId: string
  expenseId: string
}

interface GetFinanceCreditCardExpenseDetailOutput {
  expense: Awaited<ReturnType<FinanceCreditCardExpensesRepository['findById']>> & {
    category: Awaited<ReturnType<FinanceCategoriesRepository['findById']>>
  }
}

export class GetFinanceCreditCardExpenseDetailUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    expenseId,
  }: GetFinanceCreditCardExpenseDetailInput): Promise<GetFinanceCreditCardExpenseDetailOutput> {
    const expense = await this.financeCreditCardExpensesRepository.findById(expenseId, userId)
    if (!expense) throw new ResourceNotFoundError()

    const category = expense.categoryId
      ? await this.financeCategoriesRepository.findById(expense.categoryId)
      : null

    return { expense: { ...expense, category } }
  }
}
