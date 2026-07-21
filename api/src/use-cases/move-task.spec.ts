import { PositionConflictError } from '@errors/position-conflict-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { MoveTaskUseCase } from './move-task'

describe('move task use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'work',
      column: 'todo',
      title: 'A',
      position: '10.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
      category: 'work',
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
      category: 'work',
      column: 'in_progress',
      position: 15.0,
    })
    expect(result.task.column).toBe('in_progress')
    expect(result.task.category).toBe('work')
    expect(Number(result.task.position)).toBe(15.0)
  })

  it('should reorder within same column', async () => {
    const useCase = new MoveTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      category: 'work',
      column: 'todo',
      position: 5.0,
    })
    expect(result.task.column).toBe('todo')
    expect(Number(result.task.position)).toBe(5.0)
  })

  it('should move task to a different category (cross-tab move)', async () => {
    const useCase = new MoveTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      category: 'personal',
      column: 'todo',
      position: 1.0,
    })
    expect(result.task.category).toBe('personal')
    expect(result.task.column).toBe('todo')
    expect(Number(result.task.position)).toBe(1.0)
  })

  it('should throw PositionConflictError when position collides in destination (category, column)', async () => {
    const useCase = new MoveTaskUseCase(repository)
    await expect(() =>
      useCase.execute({
        taskId: 't1',
        userId: 'user-1',
        category: 'work',
        column: 'in_progress',
        position: 20.0,
      }),
    ).rejects.toThrow(PositionConflictError)
  })

  it('should NOT throw conflict when destination (category, column) is empty even if same position exists in another category', async () => {
    const useCase = new MoveTaskUseCase(repository)
    const result = await useCase.execute({
      taskId: 't1',
      userId: 'user-1',
      category: 'personal',
      column: 'todo',
      position: 20.0,
    })
    expect(result.task.category).toBe('personal')
    expect(result.task.column).toBe('todo')
    expect(Number(result.task.position)).toBe(20.0)
  })

  it('should throw ResourceNotFoundError when task does not exist', async () => {
    const useCase = new MoveTaskUseCase(repository)
    await expect(() =>
      useCase.execute({
        taskId: 'none',
        userId: 'user-1',
        category: 'work',
        column: 'todo',
        position: 1.0,
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
