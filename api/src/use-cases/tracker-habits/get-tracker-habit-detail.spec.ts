import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { GetTrackerHabitDetailUseCase } from './get-tracker-habit-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get tracker habit detail use case', () => {
  let repository: InMemoryTrackerHabitsRepository

  beforeEach(async () => {
    repository = new InMemoryTrackerHabitsRepository()
    await repository.create({
      id: 'h1',
      userId: 'user-1',
      name: 'Test',
      icon: 'sun',
      position: '1.0',
    })
  })

  it('should return habit', async () => {
    const useCase = new GetTrackerHabitDetailUseCase(repository)
    const result = await useCase.execute({ habitId: 'h1', userId: 'user-1' })
    expect(result.habit.name).toBe('Test')
  })

  it('should throw when not found', async () => {
    const useCase = new GetTrackerHabitDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ habitId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
