import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { FetchStudyCoursesUseCase } from './fetch-study-courses'

describe('fetch study courses use case', () => {
  let repository: InMemoryStudyCoursesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyCoursesRepository()
    await repository.create({
      id: 'c1',
      userId: 'user-1',
      name: 'React',
      position: '1.0',
    })
    await repository.create({
      id: 'c2',
      userId: 'user-1',
      name: 'Node',
      position: '2.0',
    })
    await repository.create({
      id: 'c3',
      userId: 'other',
      name: 'Other',
      position: '1.0',
    })
  })

  it('should list only user courses', async () => {
    const useCase = new FetchStudyCoursesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })
    expect(result.courses).toHaveLength(2)
  })
})
