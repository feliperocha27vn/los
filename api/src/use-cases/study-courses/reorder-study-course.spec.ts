import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { ReorderStudyCourseUseCase } from './reorder-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('reorder study course use case', () => {
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

  it('should update position', async () => {
    const useCase = new ReorderStudyCourseUseCase(repository)
    const result = await useCase.execute({
      courseId: 'c1',
      userId: 'user-1',
      position: 5.0,
    })
    expect(Number(result.course.position)).toBe(5.0)
  })

  it('should throw when not found', async () => {
    const useCase = new ReorderStudyCourseUseCase(repository)
    await expect(() =>
      useCase.execute({ courseId: 'none', userId: 'user-1', position: 1.0 }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
