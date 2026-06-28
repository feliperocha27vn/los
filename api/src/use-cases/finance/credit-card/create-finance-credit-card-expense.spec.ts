import { FinanceCreditCardLimitExceededError } from '@errors/finance-credit-card-limit-exceeded-error'
import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { InMemoryFinanceCreditCardExpensesRepository } from '@in-memory/in-memory-finance-credit-card-expenses-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateFinanceCreditCardExpenseUseCase } from './create-finance-credit-card-expense'

describe('create finance credit card expense use case', () => {
  let ccRepo: InMemoryFinanceCreditCardExpensesRepository
  let catRepo: InMemoryFinanceCategoriesRepository
  let useCase: CreateFinanceCreditCardExpenseUseCase

  beforeEach(async () => {
    ccRepo = new InMemoryFinanceCreditCardExpensesRepository()
    catRepo = new InMemoryFinanceCategoriesRepository()
    await catRepo.createMany([{ id: 'cat-1', name: 'Restaurante', type: 'expense', color: '#000' }])
    useCase = new CreateFinanceCreditCardExpenseUseCase(ccRepo, catRepo)
  })

  it('should default myShareAmount to 50% of totalAmount', async () => {
    const { expense } = await useCase.execute({
      userId: 'user-1',
      description: 'Restaurante',
      categoryId: 'cat-1',
      totalAmount: 200,
    })
    expect(expense.myShareAmount).toBe('100.0000000000')
    expect(expense.launchedInMain).toBe(false)
  })

  it('should accept explicit myShareAmount', async () => {
    const { expense } = await useCase.execute({
      userId: 'user-1',
      description: 'X',
      categoryId: null,
      totalAmount: 100,
      myShareAmount: 30,
    })
    expect(expense.myShareAmount).toBe('30.0000000000')
  })

  it('should throw limit exceeded when user has 200 expenses', async () => {
    for (let i = 0; i < 200; i++) {
      await ccRepo.create({
        id: `e${i}`,
        userId: 'user-1',
        categoryId: null,
        description: `e${i}`,
        totalAmount: '1.0000000000',
        myShareAmount: '0.5000000000',
        date: '2026-06-01',
      })
    }

    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        description: 'overflow',
        categoryId: null,
        totalAmount: 1,
      }),
    ).rejects.toThrow(FinanceCreditCardLimitExceededError)
  })

  it('should throw if myShareAmount is greater than totalAmount', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        description: 'X',
        categoryId: null,
        totalAmount: 100,
        myShareAmount: 150,
      }),
    ).rejects.toThrow()
  })
})
