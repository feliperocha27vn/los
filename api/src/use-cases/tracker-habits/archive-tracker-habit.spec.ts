import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { ArchiveTrackerHabitUseCase } from './archive-tracker-habit'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('archive tracker habit use case', () => {
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

  it('should archive habit (soft delete)', async () => {
    const useCase = new ArchiveTrackerHabitUseCase(repository)
    await useCase.execute({ habitId: 'h1', userId: 'user-1' })
    const found = await repository.findById('h1', 'user-1')
    expect(found?.archived).toBe(true)
  })

  it('should throw when not found', async () => {
    const useCase = new ArchiveTrackerHabitUseCase(repository)
    await expect(() =>
      useCase.execute({ habitId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
