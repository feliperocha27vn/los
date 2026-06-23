import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { UpdateCofreEntryUseCase } from './update-cofre-entry'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update cofre entry use case', () => {
  let repository: InMemoryCofreEntriesRepository

  beforeEach(async () => {
    repository = new InMemoryCofreEntriesRepository()
    await repository.create({
      id: 'entry-1',
      userId: 'user-1',
      category: 'credential',
      title: 'Old Title',
    })
  })

  it('should update entry fields', async () => {
    const useCase = new UpdateCofreEntryUseCase(repository)

    const result = await useCase.execute({
      entryId: 'entry-1',
      userId: 'user-1',
      title: 'New Title',
      passwordEnc: 'enc:new',
    })

    expect(result.entry.title).toBe('New Title')
    expect(result.entry.passwordEnc).toBe('enc:new')
  })

  it('should throw when entry not found', async () => {
    const useCase = new UpdateCofreEntryUseCase(repository)

    await expect(() =>
      useCase.execute({ entryId: 'none', userId: 'user-1', title: 'X' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
