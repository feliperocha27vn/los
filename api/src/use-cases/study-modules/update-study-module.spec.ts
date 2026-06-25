import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { UpdateStudyModuleUseCase } from './update-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update study module use case', () => {
  let repository: InMemoryStudyModulesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyModulesRepository()
    await repository.create({
      id: 'm1',
      userId: 'user-1',
      courseId: 'c1',
      name: 'Old',
      position: '1.0',
    })
  })

  it('should update name', async () => {
    const useCase = new UpdateStudyModuleUseCase(repository)
    const result = await useCase.execute({
      moduleId: 'm1',
      userId: 'user-1',
      name: 'New',
    })
    expect(result.module.name).toBe('New')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateStudyModuleUseCase(repository)
    await expect(() =>
      useCase.execute({ moduleId: 'none', userId: 'user-1', name: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
