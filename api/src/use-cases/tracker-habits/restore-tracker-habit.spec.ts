import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { RestoreTrackerHabitUseCase } from './restore-tracker-habit'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('restore tracker habit use case', () => {
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

  it('should restore archived habit', async () => {
    await repository.setArchived('h1', 'user-1', { archived: true })
    const useCase = new RestoreTrackerHabitUseCase(repository)
    const result = await useCase.execute({ habitId: 'h1', userId: 'user-1' })
    expect(result.habit.archived).toBe(false)
  })

  it('should throw when not found', async () => {
    const useCase = new RestoreTrackerHabitUseCase(repository)
    await expect(() =>
      useCase.execute({ habitId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
