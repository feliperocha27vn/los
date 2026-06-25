import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  TaskRecord,
  TasksRepository,
  UpdateTaskInput,
} from '@repositories/tasks-repository'

interface UpdateTaskPayload {
  taskId: string
  userId: string
  title?: string
  description?: string | null
}

interface UpdateTaskOutput {
  task: TaskRecord
}

export class UpdateTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({
    taskId,
    userId,
    ...data
  }: UpdateTaskPayload): Promise<UpdateTaskOutput> {
    const input: UpdateTaskInput = {}
    if (data.title !== undefined) input.title = data.title
    if (data.description !== undefined) input.description = data.description

    try {
      const task = await this.tasksRepository.update(taskId, userId, input)
      return { task }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
