import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { DeleteStudyPageUseCase } from './delete-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete study page use case', () => {
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

  it('should delete page', async () => {
    const useCase = new DeleteStudyPageUseCase(repository)
    await useCase.execute({ pageId: 'p1', userId: 'user-1' })
    const found = await repository.findById('p1', 'user-1')
    expect(found).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteStudyPageUseCase(repository)
    await expect(() =>
      useCase.execute({ pageId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
