import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { UpdateStudyCourseUseCase } from './update-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update study course use case', () => {
  let repository: InMemoryStudyCoursesRepository

  beforeEach(async () => {
    repository = new InMemoryStudyCoursesRepository()
    await repository.create({
      id: 'c1',
      userId: 'user-1',
      name: 'Old',
      position: '1.0',
    })
  })

  it('should update name', async () => {
    const useCase = new UpdateStudyCourseUseCase(repository)
    const result = await useCase.execute({
      courseId: 'c1',
      userId: 'user-1',
      name: 'New',
    })
    expect(result.course.name).toBe('New')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateStudyCourseUseCase(repository)
    await expect(() =>
      useCase.execute({ courseId: 'none', userId: 'user-1', name: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
