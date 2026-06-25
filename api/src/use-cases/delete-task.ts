import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TasksRepository } from '@repositories/tasks-repository'

interface DeleteTaskInput {
  taskId: string
  userId: string
}

export class DeleteTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ taskId, userId }: DeleteTaskInput): Promise<void> {
    try {
      await this.tasksRepository.delete(taskId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
