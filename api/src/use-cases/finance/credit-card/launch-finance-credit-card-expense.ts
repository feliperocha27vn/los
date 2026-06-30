import { randomUUID } from 'node:crypto'
import { FinanceTransactionAlreadyLaunchedError } from '@errors/finance-transaction-already-launched-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'

interface LaunchFinanceCreditCardExpenseInput {
  userId: string
  expenseId: string
}

interface LaunchFinanceCreditCardExpenseOutput {
  expense: Awaited<ReturnType<FinanceCreditCardExpensesRepository['markLaunched']>>
  transaction: Awaited<ReturnType<FinanceTransactionsRepository['create']>>
}

export class LaunchFinanceCreditCardExpenseUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
  ) {}

  async execute({
    userId,
    expenseId,
  }: LaunchFinanceCreditCardExpenseInput): Promise<LaunchFinanceCreditCardExpenseOutput> {
    const expense = await this.financeCreditCardExpensesRepository.findById(expenseId, userId)
    if (!expense) throw new ResourceNotFoundError()
    if (expense.launchedInMain) {
      throw new FinanceTransactionAlreadyLaunchedError()
    }

    const transactionId = randomUUID()

    const transaction = await this.financeTransactionsRepository.create({
      id: transactionId,
      userId,
      categoryId: expense.categoryId,
      type: 'expense',
      description: 'Minha parte do cartão',
      totalAmount: expense.myShareAmount,
      installmentsCount: 1,
      source: 'credit_card',
      isFixed: false,
    })

    await this.financeTransactionsRepository.createInstallments([
      {
        id: randomUUID(),
        transactionId,
        installmentNumber: 1,
        amount: expense.myShareAmount,
        date: expense.date,
      },
    ])

    const updatedExpense = await this.financeCreditCardExpensesRepository.markLaunched(
      expenseId,
      userId,
      transaction.id,
    )

    return { expense: updatedExpense, transaction }
  }
}

