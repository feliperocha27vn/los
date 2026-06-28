import { InMemoryFinanceTransactionsRepository } from '@in-memory/in-memory-finance-transactions-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { GetFinanceSummaryUseCase } from './get-finance-summary'

describe('get finance summary use case', () => {
  let repo: InMemoryFinanceTransactionsRepository
  let useCase: GetFinanceSummaryUseCase

  beforeEach(() => {
    repo = new InMemoryFinanceTransactionsRepository()
    useCase = new GetFinanceSummaryUseCase(repo)
  })

  it('should return zero values when no transactions in month', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      month: 6,
      year: 2026,
    })
    expect(result.income).toBe(0)
    expect(result.expenses).toBe(0)
    expect(result.balance).toBe(0)
    expect(result.period).toEqual({ month: 6, year: 2026 })
  })

  it('should sum income and expenses for the month', async () => {
    const tx1 = await repo.create({
      id: 't1',
      userId: 'user-1',
      categoryId: null,
      type: 'income',
      description: 'Salário',
      totalAmount: '5000.0000000000',
      installmentsCount: 1,
      source: 'principal',
    })
    await repo.createInstallments([
      {
        id: 'i1',
        transactionId: tx1.id,
        installmentNumber: 1,
        amount: '5000.0000000000',
        date: '2026-06-05',
      },
    ])

    const tx2 = await repo.create({
      id: 't2',
      userId: 'user-1',
      categoryId: null,
      type: 'expense',
      description: 'Mercado',
      totalAmount: '200.0000000000',
      installmentsCount: 1,
      source: 'principal',
    })
    await repo.createInstallments([
      {
        id: 'i2',
        transactionId: tx2.id,
        installmentNumber: 1,
        amount: '200.0000000000',
        date: '2026-06-10',
      },
    ])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 6,
      year: 2026,
    })
    expect(result.income).toBe(5000)
    expect(result.expenses).toBe(200)
    expect(result.balance).toBe(4800)
  })

  it('should only count installments within the month', async () => {
    const tx = await repo.create({
      id: 't1',
      userId: 'user-1',
      categoryId: null,
      type: 'expense',
      description: 'Notebook',
      totalAmount: '300.0000000000',
      installmentsCount: 3,
      source: 'principal',
    })
    await repo.createInstallments([
      {
        id: 'i1',
        transactionId: tx.id,
        installmentNumber: 1,
        amount: '100.0000000000',
        date: '2026-05-10',
      },
      {
        id: 'i2',
        transactionId: tx.id,
        installmentNumber: 2,
        amount: '100.0000000000',
        date: '2026-06-10',
      },
      {
        id: 'i3',
        transactionId: tx.id,
        installmentNumber: 3,
        amount: '100.0000000000',
        date: '2026-07-10',
      },
    ])

    const june = await useCase.execute({
      userId: 'user-1',
      month: 6,
      year: 2026,
    })
    expect(june.expenses).toBe(100)

    const may = await useCase.execute({
      userId: 'user-1',
      month: 5,
      year: 2026,
    })
    expect(may.expenses).toBe(100)
  })

  it('should isolate by user', async () => {
    const tx = await repo.create({
      id: 't1',
      userId: 'user-1',
      categoryId: null,
      type: 'income',
      description: 'Salário',
      totalAmount: '1000.0000000000',
      installmentsCount: 1,
      source: 'principal',
    })
    await repo.createInstallments([
      {
        id: 'i1',
        transactionId: tx.id,
        installmentNumber: 1,
        amount: '1000.0000000000',
        date: '2026-06-05',
      },
    ])

    const other = await useCase.execute({
      userId: 'user-2',
      month: 6,
      year: 2026,
    })
    expect(other.income).toBe(0)
  })
})
