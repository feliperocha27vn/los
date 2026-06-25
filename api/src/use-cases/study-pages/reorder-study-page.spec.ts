import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { ReorderStudyPageUseCase } from './reorder-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('reorder study page use case', () => {
  let repository: InMemoryStudyPagesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyPagesRepository()
    await repository.create({
      id: 'p1',
      userId: 'user-1',
      moduleId: 'm1',
      title: 'Test',
      position: '1.0',
    })
  })

  it('should update position', async () => {
    const useCase = new ReorderStudyPageUseCase(repository)
    const result = await useCase.execute({
      pageId: 'p1',
      userId: 'user-1',
      position: 5.0,
    })
    expect(Number(result.page.position)).toBe(5.0)
  })

  it('should throw when not found', async () => {
    const useCase = new ReorderStudyPageUseCase(repository)
    await expect(() =>
      useCase.execute({ pageId: 'none', userId: 'user-1', position: 1.0 }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
