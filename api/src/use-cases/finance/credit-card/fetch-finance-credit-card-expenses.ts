import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'

interface FetchFinanceCreditCardExpensesInput {
  userId: string
  from?: string
  to?: string
}

interface FetchFinanceCreditCardExpensesOutput {
  expenses: Array<
    Awaited<ReturnType<FinanceCreditCardExpensesRepository['findManyByUserId']>>[number] & {
      category: Awaited<ReturnType<FinanceCategoriesRepository['findById']>>
    }
  >
}

function monthRange(month: number, year: number): { from: string; to: string } {
  const padded = String(month).padStart(2, '0')
  const from = `${year}-${padded}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const to = `${year}-${padded}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

export class FetchFinanceCreditCardExpensesUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(
    filters: FetchFinanceCreditCardExpensesInput,
  ): Promise<FetchFinanceCreditCardExpensesOutput> {
    const { userId, from, to } = filters
    const range = from && to ? { from, to } : monthRangeDefault()

    const records = await this.financeCreditCardExpensesRepository.findManyByUserId(userId, range)

    const expenses = await Promise.all(
      records.map(async (e) => ({
        ...e,
        category: e.categoryId
          ? await this.financeCategoriesRepository.findById(e.categoryId)
          : null,
      })),
    )

    return { expenses }
  }
}

function monthRangeDefault(): { from: string; to: string } {
  const now = new Date()
  return monthRange(now.getUTCMonth() + 1, now.getUTCFullYear())
}
