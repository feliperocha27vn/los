import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { CreateStudyPageUseCase } from './create-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('create study page use case', () => {
  let modulesRepo: InMemoryStudyModulesRepository
  let pagesRepo: InMemoryStudyPagesRepository

  beforeEach(async () => {
    modulesRepo = new InMemoryStudyModulesRepository()
    pagesRepo = new InMemoryStudyPagesRepository()
    await modulesRepo.create({
      id: 'm1',
      userId: 'user-1',
      courseId: 'c1',
      name: 'Intro',
      position: '1.0',
    })
  })

  it('should create page in module', async () => {
    const useCase = new CreateStudyPageUseCase(pagesRepo, modulesRepo)
    const result = await useCase.execute({
      userId: 'user-1',
      moduleId: 'm1',
      title: 'Notes',
    })
    expect(result.page.id).toBeDefined()
    expect(result.page.moduleId).toBe('m1')
    expect(result.page.title).toBe('Notes')
    expect(result.page.content).toBe('')
    expect(Number(result.page.position)).toBe(1.0)
  })

  it('should throw ResourceNotFoundError when moduleId does not exist', async () => {
    const useCase = new CreateStudyPageUseCase(pagesRepo, modulesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', moduleId: 'none', title: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw ResourceNotFoundError when moduleId belongs to other user', async () => {
    await modulesRepo.create({
      id: 'm2',
      userId: 'other',
      courseId: 'c1',
      name: 'Other',
      position: '1.0',
    })
    const useCase = new CreateStudyPageUseCase(pagesRepo, modulesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', moduleId: 'm2', title: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw when module has 200 pages', async () => {
    for (let i = 0; i < 200; i++) {
      await pagesRepo.create({
        id: `p${i}`,
        moduleId: 'm1',
        userId: 'user-1',
        title: `p${i}`,
        position: String(i + 1),
      })
    }
    const useCase = new CreateStudyPageUseCase(pagesRepo, modulesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', moduleId: 'm1', title: 'overflow' }),
    ).rejects.toThrow('Limite de páginas atingido (200)')
  })
})
