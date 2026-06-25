import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { DeleteStudyModuleUseCase } from './delete-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete study module use case', () => {
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

  it('should delete module', async () => {
    const useCase = new DeleteStudyModuleUseCase(repository)
    await useCase.execute({ moduleId: 'm1', userId: 'user-1' })
    const found = await repository.findById('m1', 'user-1')
    expect(found).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteStudyModuleUseCase(repository)
    await expect(() =>
      useCase.execute({ moduleId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
