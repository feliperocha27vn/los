import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { CreateStudyModuleUseCase } from './create-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('create study module use case', () => {
  let coursesRepo: InMemoryStudyCoursesRepository
  let modulesRepo: InMemoryStudyModulesRepository

  beforeEach(async () => {
    coursesRepo = new InMemoryStudyCoursesRepository()
    modulesRepo = new InMemoryStudyModulesRepository()
    await coursesRepo.create({
      id: 'c1',
      userId: 'user-1',
      name: 'React',
      position: '1.0',
    })
  })

  it('should create module in course', async () => {
    const useCase = new CreateStudyModuleUseCase(modulesRepo, coursesRepo)
    const result = await useCase.execute({
      userId: 'user-1',
      courseId: 'c1',
      name: 'Intro',
    })
    expect(result.module.id).toBeDefined()
    expect(result.module.courseId).toBe('c1')
    expect(result.module.name).toBe('Intro')
    expect(Number(result.module.position)).toBe(1.0)
  })

  it('should throw ResourceNotFoundError when courseId does not exist', async () => {
    const useCase = new CreateStudyModuleUseCase(modulesRepo, coursesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', courseId: 'none', name: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw ResourceNotFoundError when courseId belongs to other user', async () => {
    await coursesRepo.create({
      id: 'c2',
      userId: 'other',
      name: 'Other',
      position: '1.0',
    })
    const useCase = new CreateStudyModuleUseCase(modulesRepo, coursesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', courseId: 'c2', name: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw when course has 200 modules', async () => {
    for (let i = 0; i < 200; i++) {
      await modulesRepo.create({
        id: `m${i}`,
        courseId: 'c1',
        userId: 'user-1',
        name: `m${i}`,
        position: String(i + 1),
      })
    }
    const useCase = new CreateStudyModuleUseCase(modulesRepo, coursesRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', courseId: 'c1', name: 'overflow' }),
    ).rejects.toThrow('Limite de módulos atingido (200)')
  })
})
