import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'

interface UpdateFinanceCreditCardExpenseInput {
  userId: string
  expenseId: string
  description?: string
  categoryId?: string | null
  totalAmount?: number
  myShareAmount?: number
  date?: string
}

interface UpdateFinanceCreditCardExpenseOutput {
  expense: Awaited<ReturnType<FinanceCreditCardExpensesRepository['update']>>
}

export class UpdateFinanceCreditCardExpenseUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    expenseId,
    description,
    categoryId,
    totalAmount,
    myShareAmount,
    date,
  }: UpdateFinanceCreditCardExpenseInput): Promise<UpdateFinanceCreditCardExpenseOutput> {
    const hasAny =
      description !== undefined ||
      categoryId !== undefined ||
      totalAmount !== undefined ||
      myShareAmount !== undefined ||
      date !== undefined
    if (!hasAny) {
      throw new Error('Nenhum campo para atualizar')
    }

    if (categoryId) {
      const category = await this.financeCategoriesRepository.findById(categoryId)
      if (!category) throw new ResourceNotFoundError()
    }

    try {
      const expense = await this.financeCreditCardExpensesRepository.update(expenseId, userId, {
        description,
        categoryId: categoryId === undefined ? undefined : categoryId,
        totalAmount: totalAmount !== undefined ? totalAmount.toFixed(10) : undefined,
        myShareAmount: myShareAmount !== undefined ? myShareAmount.toFixed(10) : undefined,
        date,
      })
      return { expense }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
