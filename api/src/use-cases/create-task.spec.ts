import { TaskLimitExceededError } from '@errors/task-limit-exceeded-error'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateTaskUseCase } from './create-task'

describe('create task use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(() => {
    repository = new InMemoryTasksRepository()
  })

  it('should create a task with default column todo and position 1.0', async () => {
    const useCase = new CreateTaskUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', title: 'My Task' })

    expect(result.task.id).toBeDefined()
    expect(result.task.title).toBe('My Task')
    expect(result.task.column).toBe('todo')
    expect(Number(result.task.position)).toBe(1.0)
  })

  it('should default category to other when not provided', async () => {
    const useCase = new CreateTaskUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', title: 'My Task' })

    expect(result.task.category).toBe('other')
  })

  it('should create a task with explicit category work', async () => {
    const useCase = new CreateTaskUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      title: 'Deploy',
      category: 'work',
    })

    expect(result.task.category).toBe('work')
  })

  it('should place new task at the end of the target column (max + 1.0)', async () => {
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'other',
      column: 'in_progress',
      title: 'A',
      position: '5.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
      category: 'other',
      column: 'in_progress',
      title: 'B',
      position: '10.0',
    })

    const useCase = new CreateTaskUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      title: 'C',
      column: 'in_progress',
    })

    expect(Number(result.task.position)).toBe(11.0)
  })

  it('should scope position by category (work and other both start at 1.0)', async () => {
    await repository.create({
      id: 't1',
      userId: 'user-1',
      category: 'work',
      column: 'todo',
      title: 'Work task',
      position: '5.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
      category: 'other',
      column: 'todo',
      title: 'Other task',
      position: '3.0',
    })

    const useCase = new CreateTaskUseCase(repository)
    const workResult = await useCase.execute({
      userId: 'user-1',
      title: 'New work',
      column: 'todo',
      category: 'work',
    })
    const otherResult = await useCase.execute({
      userId: 'user-1',
      title: 'New other',
      column: 'todo',
      category: 'other',
    })

    expect(Number(workResult.task.position)).toBe(6.0)
    expect(Number(otherResult.task.position)).toBe(4.0)
  })

  it('should throw TaskLimitExceededError when user has 500 tasks', async () => {
    for (let i = 0; i < 500; i++) {
      await repository.create({
        id: `t${i}`,
        userId: 'user-1',
        category: 'other',
        column: 'todo',
        title: `t${i}`,
        position: String(i + 1),
      })
    }

    const useCase = new CreateTaskUseCase(repository)
    await expect(() => useCase.execute({ userId: 'user-1', title: 'overflow' })).rejects.toThrow(
      TaskLimitExceededError,
    )
  })
})
