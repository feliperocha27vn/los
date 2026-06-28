import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'

interface UpdateFinanceTransactionInput {
  userId: string
  transactionId: string
  description?: string
  categoryId?: string | null
}

interface UpdateFinanceTransactionOutput {
  transaction: Awaited<ReturnType<FinanceTransactionsRepository['update']>>
}

export class UpdateFinanceTransactionUseCase {
  constructor(
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    transactionId,
    description,
    categoryId,
  }: UpdateFinanceTransactionInput): Promise<UpdateFinanceTransactionOutput> {
    if (description === undefined && categoryId === undefined) {
      throw new Error('Nenhum campo para atualizar')
    }

    if (categoryId) {
      const category = await this.financeCategoriesRepository.findById(categoryId)
      if (!category) throw new ResourceNotFoundError()
    }

    try {
      const transaction = await this.financeTransactionsRepository.update(transactionId, userId, {
        description,
        categoryId: categoryId === undefined ? undefined : categoryId,
      })
      return { transaction }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
