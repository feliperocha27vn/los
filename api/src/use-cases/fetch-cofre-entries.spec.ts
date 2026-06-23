import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { FetchCofreEntriesUseCase } from './fetch-cofre-entries'

describe('fetch cofre entries use case', () => {
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
      passwordEnc: 'enc:pass1',
    })

    await repository.create({
      id: 'entry-2',
      userId: 'user-1',
      category: 'api_key',
      title: 'OpenAI',
      provider: 'openai',
      tokenEnc: 'enc:token1',
    })

    await repository.create({
      id: 'entry-3',
      userId: 'other-user',
      category: 'credential',
      title: 'Other Entry',
    })
  })

  it('should list all entries for a user', async () => {
    const useCase = new FetchCofreEntriesUseCase(repository)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].title).toBe('GitHub')
    expect(result.entries[1].title).toBe('OpenAI')
  })

  it('should filter by category', async () => {
    const useCase = new FetchCofreEntriesUseCase(repository)

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'credential',
    })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].title).toBe('GitHub')
  })

  it('should search by title or username', async () => {
    const useCase = new FetchCofreEntriesUseCase(repository)

    const result = await useCase.execute({
      userId: 'user-1',
      search: 'git',
    })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].title).toBe('GitHub')
  })

  it('should not return sensitive fields', async () => {
    const useCase = new FetchCofreEntriesUseCase(repository)

    const result = await useCase.execute({ userId: 'user-1' })

    const entry = result.entries.find((e) => e.title === 'GitHub')!
    expect(entry).toBeDefined()
    expect((entry as Record<string, unknown>).passwordEnc).toBeUndefined()
  })
})
