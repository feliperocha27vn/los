import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { DeleteCofreEntryUseCase } from './delete-cofre-entry'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete cofre entry use case', () => {
  let repository: InMemoryCofreEntriesRepository

  beforeEach(async () => {
    repository = new InMemoryCofreEntriesRepository()
    await repository.create({
      id: 'entry-1',
      userId: 'user-1',
      category: 'credential',
      title: 'Test',
    })
  })

  it('should delete entry', async () => {
    const useCase = new DeleteCofreEntryUseCase(repository)

    await useCase.execute({ entryId: 'entry-1', userId: 'user-1' })

    const entry = await repository.findById('entry-1', 'user-1')
    expect(entry).toBeNull()
  })

  it('should throw when entry not found', async () => {
    const useCase = new DeleteCofreEntryUseCase(repository)

    await expect(() =>
      useCase.execute({ entryId: 'none', userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
