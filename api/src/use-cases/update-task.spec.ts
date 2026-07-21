import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpdateTaskUseCase } from './update-task'

describe('update task use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'other',
      column: 'todo',
      title: 'Old',
      description: 'Old desc',
      position: '1.0',
    })
  })

  it('should update title and description', async () => {
    const useCase = new UpdateTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      title: 'New',
      description: 'New desc',
    })
    expect(result.task.title).toBe('New')
    expect(result.task.description).toBe('New desc')
  })

  it('should partial update (only title)', async () => {
    const useCase = new UpdateTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      title: 'Just title',
    })
    expect(result.task.title).toBe('Just title')
    expect(result.task.description).toBe('Old desc')
  })

  it('should reclassify category (move to another tab)', async () => {
    const useCase = new UpdateTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      category: 'work',
    })
    expect(result.task.category).toBe('work')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateTaskUseCase(repository)
    await expect(() =>
      useCase.execute({ taskId: 'none', userId: 'user-1', title: 'X' }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
