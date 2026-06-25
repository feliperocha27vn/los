import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TaskRecord, TasksRepository } from '@repositories/tasks-repository'

interface GetTaskDetailInput {
  taskId: string
  userId: string
}

interface GetTaskDetailOutput {
  task: TaskRecord
}

export class GetTaskDetailUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({
    taskId,
    userId,
  }: GetTaskDetailInput): Promise<GetTaskDetailOutput> {
    const task = await this.tasksRepository.findById(taskId, userId)
    if (!task) throw new ResourceNotFoundError()
    return { task }
  }
}
