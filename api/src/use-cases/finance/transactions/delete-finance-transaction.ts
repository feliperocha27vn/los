import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'

interface DeleteFinanceTransactionInput {
  userId: string
  transactionId: string
}

export class DeleteFinanceTransactionUseCase {
  constructor(private readonly financeTransactionsRepository: FinanceTransactionsRepository) {}

  async execute({ userId, transactionId }: DeleteFinanceTransactionInput): Promise<void> {
    try {
      await this.financeTransactionsRepository.delete(transactionId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
