import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { DeleteStudyCourseUseCase } from './delete-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete study course use case', () => {
  let repository: InMemoryStudyCoursesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyCoursesRepository()
    await repository.create({
      id: 'c1',
      userId: 'user-1',
      name: 'Test',
      position: '1.0',
    })
  })

  it('should delete course', async () => {
    const useCase = new DeleteStudyCourseUseCase(repository)
    await useCase.execute({ courseId: 'c1', userId: 'user-1' })
    const found = await repository.findById('c1', 'user-1')
    expect(found).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteStudyCourseUseCase(repository)
    await expect(() =>
      useCase.execute({ courseId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
