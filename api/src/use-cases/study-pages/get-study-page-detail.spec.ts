import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { GetStudyPageDetailUseCase } from './get-study-page-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get study page detail use case', () => {
  let coursesRepo: InMemoryStudyCoursesRepository
  let modulesRepo: InMemoryStudyModulesRepository
  let pagesRepo: InMemoryStudyPagesRepository

  beforeEach(async () => {
    coursesRepo = new InMemoryStudyCoursesRepository()
    modulesRepo = new InMemoryStudyModulesRepository()
    pagesRepo = new InMemoryStudyPagesRepository()
    await coursesRepo.create({
      id: 'c1',
      userId: 'user-1',
      name: 'React',
      position: '1.0',
    })
    await modulesRepo.create({
      id: 'm1',
      userId: 'user-1',
      courseId: 'c1',
      name: 'Intro',
      position: '1.0',
    })
    await pagesRepo.create({
      id: 'p1',
      userId: 'user-1',
      moduleId: 'm1',
      title: 'Notes',
      position: '1.0',
    })
  })

  it('should return page with breadcrumb', async () => {
    const useCase = new GetStudyPageDetailUseCase(
      pagesRepo,
      modulesRepo,
      coursesRepo,
    )
    const result = await useCase.execute({ pageId: 'p1', userId: 'user-1' })

    expect(result.page.title).toBe('Notes')
    expect(result.breadcrumbs.course).toEqual({ id: 'c1', name: 'React' })
    expect(result.breadcrumbs.module).toEqual({ id: 'm1', name: 'Intro' })
    expect(result.breadcrumbs.page).toEqual({ id: 'p1', name: 'Notes' })
  })

  it('should throw ResourceNotFoundError when page does not exist', async () => {
    const useCase = new GetStudyPageDetailUseCase(
      pagesRepo,
      modulesRepo,
      coursesRepo,
    )
    await expect(() =>
      useCase.execute({ pageId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
