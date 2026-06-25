import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { UpdateStudyPageUseCase } from './update-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update study page use case', () => {
  let repository: InMemoryStudyPagesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyPagesRepository()
    await repository.create({
      id: 'p1',
      userId: 'user-1',
      moduleId: 'm1',
      title: 'Old',
      content: 'old content',
      position: '1.0',
    })
  })

  it('should update title and content', async () => {
    const useCase = new UpdateStudyPageUseCase(repository)
    const result = await useCase.execute({
      pageId: 'p1',
      userId: 'user-1',
      title: 'New',
      content: 'new content',
    })
    expect(result.page.title).toBe('New')
    expect(result.page.content).toBe('new content')
  })

  it('should partial update', async () => {
    const useCase = new UpdateStudyPageUseCase(repository)
    const result = await useCase.execute({
      pageId: 'p1',
      userId: 'user-1',
      content: 'only content',
    })
    expect(result.page.title).toBe('Old')
    expect(result.page.content).toBe('only content')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateStudyPageUseCase(repository)
    await expect(() =>
      useCase.execute({ pageId: 'none', userId: 'user-1', title: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
