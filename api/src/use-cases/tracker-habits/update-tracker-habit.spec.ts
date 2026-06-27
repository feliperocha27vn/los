import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { UpdateTrackerHabitUseCase } from './update-tracker-habit'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update tracker habit use case', () => {
  let repository: InMemoryTrackerHabitsRepository

  beforeEach(async () => {
    repository = new InMemoryTrackerHabitsRepository()
    await repository.create({
      id: 'h1',
      userId: 'user-1',
      name: 'Old',
      icon: 'sun',
      position: '1.0',
    })
  })

  it('should update name and icon', async () => {
    const useCase = new UpdateTrackerHabitUseCase(repository)
    const result = await useCase.execute({
      habitId: 'h1',
      userId: 'user-1',
      name: 'New',
      icon: 'moon',
    })
    expect(result.habit.name).toBe('New')
    expect(result.habit.icon).toBe('moon')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateTrackerHabitUseCase(repository)
    await expect(() =>
      useCase.execute({ habitId: 'none', userId: 'user-1', name: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
