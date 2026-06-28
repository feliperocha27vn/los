import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'

interface GetFinanceSummaryInput {
  userId: string
  month: number
  year: number
}

interface GetFinanceSummaryOutput {
  period: { month: number; year: number }
  income: number
  expenses: number
  balance: number
}

function rangeFor(month: number, year: number): { from: string; to: string } {
  const padded = String(month).padStart(2, '0')
  const from = `${year}-${padded}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const to = `${year}-${padded}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

export class GetFinanceSummaryUseCase {
  constructor(private readonly financeTransactionsRepository: FinanceTransactionsRepository) {}

  async execute({ userId, month, year }: GetFinanceSummaryInput): Promise<GetFinanceSummaryOutput> {
    const { from, to } = rangeFor(month, year)

    const income = await this.financeTransactionsRepository.sumInstallmentsInRange(
      userId,
      'income',
      from,
      to,
    )
    const expenses = await this.financeTransactionsRepository.sumInstallmentsInRange(
      userId,
      'expense',
      from,
      to,
    )

    return {
      period: { month, year },
      income,
      expenses,
      balance: income - expenses,
    }
  }
}
