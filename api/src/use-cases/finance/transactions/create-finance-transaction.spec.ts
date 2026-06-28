import { FinanceTransactionLimitExceededError } from '@errors/finance-transaction-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { InMemoryFinanceTransactionsRepository } from '@in-memory/in-memory-finance-transactions-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateFinanceTransactionUseCase } from './create-finance-transaction'

describe('create finance transaction use case', () => {
  let transactionsRepo: InMemoryFinanceTransactionsRepository
  let categoriesRepo: InMemoryFinanceCategoriesRepository
  let useCase: CreateFinanceTransactionUseCase

  beforeEach(async () => {
    transactionsRepo = new InMemoryFinanceTransactionsRepository()
    categoriesRepo = new InMemoryFinanceCategoriesRepository()
    await categoriesRepo.createMany([
      { id: 'cat-1', name: 'Alimentação', type: 'expense', color: '#ef4444' },
    ])
    useCase = new CreateFinanceTransactionUseCase(transactionsRepo, categoriesRepo)
  })

  it('should create a transaction with single installment', async () => {
    const { transaction, installments } = await useCase.execute({
      userId: 'user-1',
      type: 'expense',
      description: 'Almoço',
      categoryId: 'cat-1',
      totalAmount: 50,
    })

    expect(transaction.id).toBeDefined()
    expect(transaction.type).toBe('expense')
    expect(transaction.totalAmount).toBe('50.0000000000')
    expect(transaction.installmentsCount).toBe(1)
    expect(transaction.source).toBe('principal')
    expect(installments).toHaveLength(1)
    expect(installments[0].installmentNumber).toBe(1)
    expect(installments[0].amount).toBe('50.0000000000')
  })

  it('should create N installments with equal split', async () => {
    const { transaction, installments } = await useCase.execute({
      userId: 'user-1',
      type: 'expense',
      description: 'Notebook',
      categoryId: null,
      totalAmount: 300,
      installmentsCount: 3,
      firstInstallmentDate: '2026-06-10',
    })

    expect(transaction.installmentsCount).toBe(3)
    expect(installments).toHaveLength(3)
    expect(installments[0].date).toBe('2026-06-10')
    expect(installments[1].date).toBe('2026-07-10')
    expect(installments[2].date).toBe('2026-08-10')
    for (const inst of installments) {
      expect(inst.amount).toBe('100.0000000000')
    }
  })

  it('should throw ResourceNotFoundError when categoryId is invalid', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        type: 'expense',
        description: 'X',
        categoryId: 'non-existent',
        totalAmount: 10,
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw limit exceeded when user has 500 transactions', async () => {
    for (let i = 0; i < 500; i++) {
      await transactionsRepo.create({
        id: `t${i}`,
        userId: 'user-1',
        categoryId: null,
        type: 'expense',
        description: `t${i}`,
        totalAmount: '1.0000000000',
        installmentsCount: 1,
        source: 'principal',
      })
    }

    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        type: 'expense',
        description: 'overflow',
        categoryId: null,
        totalAmount: 1,
      }),
    ).rejects.toThrow(FinanceTransactionLimitExceededError)
  })

  it('should reject invalid installmentsCount', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        type: 'expense',
        description: 'X',
        categoryId: null,
        totalAmount: 1,
        installmentsCount: 0,
      }),
    ).rejects.toThrow()

    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        type: 'expense',
        description: 'X',
        categoryId: null,
        totalAmount: 1,
        installmentsCount: 25,
      }),
    ).rejects.toThrow()
  })
})
