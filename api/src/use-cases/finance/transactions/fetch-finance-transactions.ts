import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type {
  FinanceInstallmentRecord,
  FinanceTransactionsRepository,
  FinanceTransactionType,
} from '@repositories/finance-transactions-repository'

interface FetchFinanceTransactionsInput {
  userId: string
  type?: FinanceTransactionType
  categoryId?: string
  from?: string
  to?: string
  search?: string
}

interface FetchFinanceTransactionsOutput {
  transactions: Array<
    Awaited<ReturnType<FinanceTransactionsRepository['findManyByUserId']>>[number] & {
      category: Awaited<ReturnType<FinanceCategoriesRepository['findById']>>
    }
  >
}

export class FetchFinanceTransactionsUseCase {
  constructor(
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(filters: FetchFinanceTransactionsInput): Promise<FetchFinanceTransactionsOutput> {
    const { userId, ...rest } = filters
    const records = await this.financeTransactionsRepository.findManyByUserId(userId, rest)

    const transactions = await Promise.all(
      records.map(async (t) => ({
        ...t,
        category: t.categoryId
          ? await this.financeCategoriesRepository.findById(t.categoryId)
          : null,
      })),
    )

    return { transactions }
  }
}
