import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { ReorderStudyModuleUseCase } from './reorder-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('reorder study module use case', () => {
  let repository: InMemoryStudyModulesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyModulesRepository()
    await repository.create({
      id: 'm1',
      userId: 'user-1',
      courseId: 'c1',
      name: 'Test',
      position: '1.0',
    })
  })

  it('should update position', async () => {
    const useCase = new ReorderStudyModuleUseCase(repository)
    const result = await useCase.execute({
      moduleId: 'm1',
      userId: 'user-1',
      position: 5.0,
    })
    expect(Number(result.module.position)).toBe(5.0)
  })

  it('should throw when not found', async () => {
    const useCase = new ReorderStudyModuleUseCase(repository)
    await expect(() =>
      useCase.execute({ moduleId: 'none', userId: 'user-1', position: 1.0 }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
