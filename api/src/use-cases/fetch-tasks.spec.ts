import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { FetchTasksUseCase } from './fetch-tasks'

describe('fetch tasks use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'work',
      column: 'todo',
      title: 'Alpha',
      description: 'first',
      position: '1.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
      category: 'personal',
      column: 'in_progress',
      title: 'Beta',
      description: 'second',
      position: '1.0',
    })
    await repository.create({
      id: 't3',
      userId: 'user-1',
      category: 'other',
      column: 'todo',
      title: 'Gamma',
      description: 'third',
      position: '1.0',
    })
    await repository.create({
      id: 't4',
      userId: 'other',
      category: 'work',
      column: 'todo',
      title: 'Delta',
      description: 'other user',
      position: '1.0',
    })
  })

  it('should list only tasks of the user', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })
    expect(result.tasks).toHaveLength(3)
  })

  it('should filter by column', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', column: 'todo' })
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks.map((t) => t.title).sort()).toEqual(['Alpha', 'Gamma'])
  })

  it('should filter by category work', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', category: 'work' })
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Alpha')
  })

  it('should filter by category and column combined', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      category: 'other',
      column: 'todo',
    })
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Gamma')
  })

  it('should search by title', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', search: 'alpha' })
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Alpha')
  })

  it('should search by description', async () => {
    const useCase = new FetchTasksUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', search: 'second' })
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Beta')
  })
})
