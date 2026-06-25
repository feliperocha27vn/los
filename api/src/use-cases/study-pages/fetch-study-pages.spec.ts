import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { FetchStudyPagesUseCase } from './fetch-study-pages'

describe('fetch study pages use case', () => {
  let repository: InMemoryStudyPagesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyPagesRepository()
    await repository.create({
      id: 'p1',
      userId: 'user-1',
      moduleId: 'm1',
      title: 'A',
      position: '1.0',
    })
    await repository.create({
      id: 'p2',
      userId: 'user-1',
      moduleId: 'm2',
      title: 'B',
      position: '1.0',
    })
    await repository.create({
      id: 'p3',
      userId: 'other',
      moduleId: 'm1',
      title: 'C',
      position: '1.0',
    })
  })

  it('should list all user pages', async () => {
    const useCase = new FetchStudyPagesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })
    expect(result.pages).toHaveLength(2)
  })

  it('should filter by moduleId', async () => {
    const useCase = new FetchStudyPagesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', moduleId: 'm1' })
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].id).toBe('p1')
  })
})
