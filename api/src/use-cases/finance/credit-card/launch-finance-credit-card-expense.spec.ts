import { FinanceTransactionAlreadyLaunchedError } from '@errors/finance-transaction-already-launched-error'
import { FinanceTransactionNotLaunchedError } from '@errors/finance-transaction-not-launched-error'
import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { InMemoryFinanceCreditCardExpensesRepository } from '@in-memory/in-memory-finance-credit-card-expenses-repository'
import { InMemoryFinanceTransactionsRepository } from '@in-memory/in-memory-finance-transactions-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateFinanceCreditCardExpenseUseCase } from './create-finance-credit-card-expense'
import { LaunchFinanceCreditCardExpenseUseCase } from './launch-finance-credit-card-expense'
import { UnlaunchFinanceCreditCardExpenseUseCase } from './unlaunch-finance-credit-card-expense'

describe('launch / unlaunch credit card expense use case', () => {
  let ccRepo: InMemoryFinanceCreditCardExpensesRepository
  let txRepo: InMemoryFinanceTransactionsRepository
  let catRepo: InMemoryFinanceCategoriesRepository
  let createUseCase: CreateFinanceCreditCardExpenseUseCase
  let launchUseCase: LaunchFinanceCreditCardExpenseUseCase
  let unlaunchUseCase: UnlaunchFinanceCreditCardExpenseUseCase

  beforeEach(async () => {
    ccRepo = new InMemoryFinanceCreditCardExpensesRepository()
    txRepo = new InMemoryFinanceTransactionsRepository()
    catRepo = new InMemoryFinanceCategoriesRepository()
    await catRepo.createMany([
      { id: 'cat-1', name: 'Alimentação', type: 'expense', color: '#ef4444' },
    ])
    createUseCase = new CreateFinanceCreditCardExpenseUseCase(ccRepo, catRepo)
    launchUseCase = new LaunchFinanceCreditCardExpenseUseCase(ccRepo, txRepo)
    unlaunchUseCase = new UnlaunchFinanceCreditCardExpenseUseCase(ccRepo, txRepo)
  })

  it('should launch a credit card expense creating a principal transaction', async () => {
    const { expense } = await createUseCase.execute({
      userId: 'user-1',
      description: 'Supermercado',
      categoryId: 'cat-1',
      totalAmount: 300,
      myShareAmount: 150,
    })

    const { expense: launched, transaction } = await launchUseCase.execute({
      userId: 'user-1',
      expenseId: expense.id,
    })

    expect(launched.launchedInMain).toBe(true)
    expect(launched.linkedTransactionId).toBe(transaction.id)
    expect(transaction.description).toBe('Minha parte do cartão')
    expect(transaction.totalAmount).toBe('150.0000000000')
    expect(transaction.source).toBe('credit_card')
    expect(transaction.type).toBe('expense')
  })

  it('should throw if already launched', async () => {
    const { expense } = await createUseCase.execute({
      userId: 'user-1',
      description: 'X',
      categoryId: null,
      totalAmount: 100,
      myShareAmount: 50,
    })
    await launchUseCase.execute({ userId: 'user-1', expenseId: expense.id })

    await expect(() =>
      launchUseCase.execute({ userId: 'user-1', expenseId: expense.id }),
    ).rejects.toThrow(FinanceTransactionAlreadyLaunchedError)
  })

  it('should unlaunch and delete the linked transaction', async () => {
    const { expense } = await createUseCase.execute({
      userId: 'user-1',
      description: 'X',
      categoryId: null,
      totalAmount: 100,
      myShareAmount: 50,
    })
    const { transaction } = await launchUseCase.execute({
      userId: 'user-1',
      expenseId: expense.id,
    })

    const { expense: unlaunched } = await unlaunchUseCase.execute({
      userId: 'user-1',
      expenseId: expense.id,
    })

    expect(unlaunched.launchedInMain).toBe(false)
    expect(unlaunched.linkedTransactionId).toBeNull()

    const stillExists = await txRepo.findById(transaction.id, 'user-1')
    expect(stillExists).toBeNull()
  })

  it('should throw when unlaunching a non-launched expense', async () => {
    const { expense } = await createUseCase.execute({
      userId: 'user-1',
      description: 'X',
      categoryId: null,
      totalAmount: 100,
      myShareAmount: 50,
    })

    await expect(() =>
      unlaunchUseCase.execute({ userId: 'user-1', expenseId: expense.id }),
    ).rejects.toThrow(FinanceTransactionNotLaunchedError)
  })
})
