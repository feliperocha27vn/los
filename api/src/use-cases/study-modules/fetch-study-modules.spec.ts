import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { FetchStudyModulesUseCase } from './fetch-study-modules'

describe('fetch study modules use case', () => {
  let repository: InMemoryStudyModulesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyModulesRepository()
    await repository.create({
      id: 'm1',
      userId: 'user-1',
      courseId: 'c1',
      name: 'A',
      position: '1.0',
    })
    await repository.create({
      id: 'm2',
      userId: 'user-1',
      courseId: 'c2',
      name: 'B',
      position: '1.0',
    })
    await repository.create({
      id: 'm3',
      userId: 'other',
      courseId: 'c1',
      name: 'C',
      position: '1.0',
    })
  })

  it('should list all user modules', async () => {
    const useCase = new FetchStudyModulesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })
    expect(result.modules).toHaveLength(2)
  })

  it('should filter by courseId', async () => {
    const useCase = new FetchStudyModulesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', courseId: 'c1' })
    expect(result.modules).toHaveLength(1)
    expect(result.modules[0].id).toBe('m1')
  })
})
