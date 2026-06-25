import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { GetStudyModuleDetailUseCase } from './get-study-module-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get study module detail use case', () => {
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

  it('should return module', async () => {
    const useCase = new GetStudyModuleDetailUseCase(repository)
    const result = await useCase.execute({ moduleId: 'm1', userId: 'user-1' })
    expect(result.module.name).toBe('Test')
  })

  it('should throw when not found', async () => {
    const useCase = new GetStudyModuleDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ moduleId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
