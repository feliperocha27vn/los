import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { CreateTaskUseCase } from './create-task'
import { TaskLimitExceededError } from '@errors/task-limit-exceeded-error'

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

  it('should place new task at the end of the target column (max + 1.0)', async () => {
    await repository.create({
      id: 't1',
      userId: 'user-1',
      column: 'in_progress',
      title: 'A',
      position: '5.0',
    })
    await repository.create({
      id: 't2',
      userId: 'user-1',
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

  it('should throw TaskLimitExceededError when user has 500 tasks', async () => {
    for (let i = 0; i < 500; i++) {
      await repository.create({
        id: `t${i}`,
        userId: 'user-1',
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
