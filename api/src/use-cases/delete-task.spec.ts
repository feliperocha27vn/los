import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { DeleteTaskUseCase } from './delete-task'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete task use case', () => {
  let repository: InMemoryTasksRepository

  beforeEach(async () => {
    repository = new InMemoryTasksRepository()
    await repository.create({
      id: 't1',
      userId: 'user-1',
      column: 'todo',
      title: 'Test',
      position: '1.0',
    })
  })

  it('should delete task', async () => {
    const useCase = new DeleteTaskUseCase(repository)
    await useCase.execute({ taskId: 't1', userId: 'user-1' })
    const found = await repository.findById('t1', 'user-1')
    expect(found).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteTaskUseCase(repository)
    await expect(() =>
      useCase.execute({ taskId: 'none', userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
