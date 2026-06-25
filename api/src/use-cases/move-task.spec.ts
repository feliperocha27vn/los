import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { MoveTaskUseCase } from './move-task'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { PositionConflictError } from '@errors/position-conflict-error'

describe('move task use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      column: 'todo',
      title: 'A',
      position: '10.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
      column: 'in_progress',
      title: 'B',
      position: '20.0',
    })
  })

  it('should move task to another column with explicit position', async () => {
    const useCase = new MoveTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      column: 'in_progress',
      position: 15.0,
    })
    expect(result.task.column).toBe('in_progress')
    expect(Number(result.task.position)).toBe(15.0)
  })

  it('should reorder within same column', async () => {
    const useCase = new MoveTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      column: 'todo',
      position: 5.0,
    })
    expect(result.task.column).toBe('todo')
    expect(Number(result.task.position)).toBe(5.0)
  })

  it('should throw PositionConflictError when position collides in destination column', async () => {
    const useCase = new MoveTaskUseCase(repository)
    await expect(() =>
      useCase.execute({
        taskId: 't1',
        userId: 'user-1',
        column: 'in_progress',
        position: 20.0,
      }),
    ).rejects.toThrow(PositionConflictError)
  })

  it('should throw ResourceNotFoundError when task does not exist', async () => {
    const useCase = new MoveTaskUseCase(repository)
    await expect(() =>
      useCase.execute({
        taskId: 'none',
        userId: 'user-1',
        column: 'todo',
        position: 1.0,
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
