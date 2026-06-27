import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { DeleteTrackerRecordUseCase } from './delete-tracker-record'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete tracker record use case', () => {
  let repository: InMemoryTrackerRecordsRepository

  beforeEach(async () => {
    repository = new InMemoryTrackerRecordsRepository()
    await repository.create({
      id: 'r1',
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-25',
      completed: true,
      energy: null,
      quality: null,
      note: null,
    })
  })

  it('should delete record', async () => {
    const useCase = new DeleteTrackerRecordUseCase(repository)
    await useCase.execute({ recordId: 'r1', userId: 'user-1' })
    const found = await repository.findById('r1', 'user-1')
    expect(found).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteTrackerRecordUseCase(repository)
    await expect(() =>
      useCase.execute({ recordId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
