import { describe, it, expect, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { CreateCofreEntryUseCase } from './create-cofre-entry'

describe('create cofre entry use case', () => {
  let repository: InMemoryCofreEntriesRepository

  beforeEach(() => {
    repository = new InMemoryCofreEntriesRepository()
  })

  it('should create a credential entry', async () => {
    const useCase = new CreateCofreEntryUseCase(repository)

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'credential',
      title: 'GitHub',
      url: 'https://github.com',
      username: 'admin',
      passwordEnc: 'enc:xyz',
    })

    expect(result.entry.id).toBeDefined()
    expect(result.entry.title).toBe('GitHub')
    expect(result.entry.category).toBe('credential')
    expect(result.entry.passwordEnc).toBe('enc:xyz')
  })
})
