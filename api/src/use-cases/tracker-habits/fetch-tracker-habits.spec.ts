import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { FetchTrackerHabitsUseCase } from './fetch-tracker-habits'

describe('fetch tracker habits use case', () => {
  let repository: InMemoryTrackerHabitsRepository

  beforeEach(async () => {
    repository = new InMemoryTrackerHabitsRepository()
    await repository.create({
      id: 'h1',
      userId: 'user-1',
      name: 'A',
      icon: 'sun',
      position: '1.0',
    })
    await repository.create({
      id: 'h2',
      userId: 'user-1',
      name: 'B',
      icon: 'sun',
      position: '2.0',
    })
    await repository.create({
      id: 'h3',
      userId: 'other',
      name: 'C',
      icon: 'sun',
      position: '1.0',
    })
  })

  it('should list only user habits', async () => {
    const useCase = new FetchTrackerHabitsUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })
    expect(result.habits).toHaveLength(2)
  })

  it('should include archived when requested', async () => {
    await repository.setArchived('h1', 'user-1', { archived: true })
    const useCase = new FetchTrackerHabitsUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      includeArchived: true,
    })
    expect(result.habits).toHaveLength(2)
  })
})
