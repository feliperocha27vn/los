import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { CreateStudyCourseUseCase } from './create-study-course'

describe('create study course use case', () => {
  let repository: InMemoryStudyCoursesRepository

  beforeEach(() => {
    repository = new InMemoryStudyCoursesRepository()
  })

  it('should create a course with default position 1.0', async () => {
    const useCase = new CreateStudyCourseUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', name: 'React' })

    expect(result.course.id).toBeDefined()
    expect(result.course.name).toBe('React')
    expect(Number(result.course.position)).toBe(1.0)
  })

  it('should place new course at end (max + 1.0)', async () => {
    await repository.create({
      id: 'c1',
      userId: 'user-1',
      name: 'A',
      position: '5.0',
    })
    await repository.create({
      id: 'c2',
      userId: 'user-1',
      name: 'B',
      position: '10.0',
    })

    const useCase = new CreateStudyCourseUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', name: 'C' })

    expect(Number(result.course.position)).toBe(11.0)
  })

  it('should throw when user has 50 courses', async () => {
    for (let i = 0; i < 50; i++) {
      await repository.create({
        id: `c${i}`,
        userId: 'user-1',
        name: `c${i}`,
        position: String(i + 1),
      })
    }

    const useCase = new CreateStudyCourseUseCase(repository)
    await expect(() =>
      useCase.execute({ userId: 'user-1', name: 'overflow' }),
    ).rejects.toThrow('Limite de cursos atingido (50)')
  })
})
