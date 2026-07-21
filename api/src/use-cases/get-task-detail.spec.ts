import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { GetTaskDetailUseCase } from './get-task-detail'

describe('get task detail use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'work',
      column: 'todo',
      title: 'Test',
      description: 'desc',
      position: '1.0',
    })
  })

  it('should return task with full fields', async () => {
    const useCase = new GetTaskDetailUseCase(repository)
    const result = await useCase.execute({ taskId: 't1', userId: 'user-1' })
    expect(result.task.title).toBe('Test')
    expect(result.task.description).toBe('desc')
    expect(result.task.category).toBe('work')
  })

  it('should throw when not found', async () => {
    const useCase = new GetTaskDetailUseCase(repository)
    await expect(() => useCase.execute({ taskId: 'none', userId: 'user-1' })).rejects.toThrow(
      ResourceNotFoundError,
    )
  })
})
