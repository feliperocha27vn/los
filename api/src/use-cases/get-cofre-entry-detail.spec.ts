import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { GetCofreEntryDetailUseCase } from './get-cofre-entry-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get cofre entry detail use case', () => {
  let repository: InMemoryCofreEntriesRepository

  beforeEach(async () => {
    repository = new InMemoryCofreEntriesRepository()

    await repository.create({
      id: 'entry-1',
      userId: 'user-1',
      category: 'credential',
      title: 'GitHub',
      url: 'https://github.com',
      username: 'admin',
      passwordEnc: 'encrypted:abc123:xyz',
    })
  })

  it('should return full entry with sensitive fields', async () => {
    const useCase = new GetCofreEntryDetailUseCase(repository)

    const result = await useCase.execute({
      entryId: 'entry-1',
      userId: 'user-1',
    })

    expect(result.entry.id).toBe('entry-1')
    expect(result.entry.title).toBe('GitHub')
    expect(result.entry.passwordEnc).toBe('encrypted:abc123:xyz')
  })

  it('should throw when entry not found', async () => {
    const useCase = new GetCofreEntryDetailUseCase(repository)

    await expect(() =>
      useCase.execute({ entryId: 'nonexistent', userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw when entry belongs to other user', async () => {
    const useCase = new GetCofreEntryDetailUseCase(repository)

    await expect(() =>
      useCase.execute({ entryId: 'entry-1', userId: 'other-user' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
