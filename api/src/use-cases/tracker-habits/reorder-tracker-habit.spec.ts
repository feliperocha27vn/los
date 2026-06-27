import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { ReorderTrackerHabitUseCase } from './reorder-tracker-habit'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('reorder tracker habit use case', () => {
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

  it('should update position', async () => {
    const useCase = new ReorderTrackerHabitUseCase(repository)
    const result = await useCase.execute({
      habitId: 'h1',
      userId: 'user-1',
      position: 5.0,
    })
    expect(Number(result.habit.position)).toBe(5.0)
  })

  it('should throw when not found', async () => {
    const useCase = new ReorderTrackerHabitUseCase(repository)
    await expect(() =>
      useCase.execute({ habitId: 'none', userId: 'user-1', position: 1.0 }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
