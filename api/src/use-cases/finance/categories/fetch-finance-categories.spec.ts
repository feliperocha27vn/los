import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { FetchFinanceCategoriesUseCase } from './fetch-finance-categories'

describe('fetch finance categories use case', () => {
  let repository: InMemoryFinanceCategoriesRepository

  beforeEach(async () => {
    repository = new InMemoryFinanceCategoriesRepository()
    await repository.createMany([
      { id: 'c1', name: 'Alimentação', type: 'expense', color: '#ef4444' },
      { id: 'c2', name: 'Salário', type: 'income', color: '#22c55e' },
      { id: 'c3', name: 'Transporte', type: 'expense', color: '#f59e0b' },
    ])
  })

  it('should list all categories sorted by name', async () => {
    const useCase = new FetchFinanceCategoriesUseCase(repository)
    const { categories } = await useCase.execute({})
    expect(categories).toHaveLength(3)
    expect(categories[0].name).toBe('Alimentação')
  })

  it('should filter by type expense', async () => {
    const useCase = new FetchFinanceCategoriesUseCase(repository)
    const { categories } = await useCase.execute({ type: 'expense' })
    expect(categories.every((c) => c.type === 'expense')).toBe(true)
    expect(categories).toHaveLength(2)
  })

  it('should filter by type income', async () => {
    const useCase = new FetchFinanceCategoriesUseCase(repository)
    const { categories } = await useCase.execute({ type: 'income' })
    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Salário')
  })
})
