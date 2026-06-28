import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type {
  FinanceInstallmentRecord,
  FinanceTransactionsRepository,
} from '@repositories/finance-transactions-repository'

interface GetFinanceTransactionDetailInput {
  userId: string
  transactionId: string
}

interface GetFinanceTransactionDetailOutput {
  transaction: Awaited<ReturnType<FinanceTransactionsRepository['findById']>> & {
    category: Awaited<ReturnType<FinanceCategoriesRepository['findById']>>
  }
  installments: FinanceInstallmentRecord[]
}

export class GetFinanceTransactionDetailUseCase {
  constructor(
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    transactionId,
  }: GetFinanceTransactionDetailInput): Promise<GetFinanceTransactionDetailOutput> {
    const transaction = await this.financeTransactionsRepository.findById(transactionId, userId)
    if (!transaction) throw new ResourceNotFoundError()

    const installments =
      await this.financeTransactionsRepository.findInstallmentsByTransactionId(transactionId)

    const category = transaction.categoryId
      ? await this.financeCategoriesRepository.findById(transaction.categoryId)
      : null

    return {
      transaction: { ...transaction, category },
      installments,
    }
  }
}
