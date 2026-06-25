import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { GetStudyCourseDetailUseCase } from './get-study-course-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get study course detail use case', () => {
  let repository: InMemoryStudyCoursesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyCoursesRepository()
    await repository.create({
      id: 'c1',
      userId: 'user-1',
      name: 'React',
      position: '1.0',
    })
  })

  it('should return course', async () => {
    const useCase = new GetStudyCourseDetailUseCase(repository)
    const result = await useCase.execute({ courseId: 'c1', userId: 'user-1' })
    expect(result.course.name).toBe('React')
  })

  it('should throw when not found', async () => {
    const useCase = new GetStudyCourseDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ courseId: 'none', userId: 'user-1' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
