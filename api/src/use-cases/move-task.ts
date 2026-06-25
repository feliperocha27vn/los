import { PositionConflictError } from '@errors/position-conflict-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  MoveTaskInput,
  TaskColumn,
  TaskRecord,
  TasksRepository,
} from '@repositories/tasks-repository'

interface MoveTaskPayload extends MoveTaskInput {
  taskId: string
  userId: string
}

interface MoveTaskOutput {
  task: TaskRecord
}

export class MoveTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ taskId, userId, column, position }: MoveTaskPayload): Promise<MoveTaskOutput> {
    const existing = await this.tasksRepository.findById(taskId, userId)
    if (!existing) throw new ResourceNotFoundError()

    const newPosition = position.toFixed(10)
    const collision = await this.findPositionCollision(userId, column, newPosition, taskId)
    if (collision) throw new PositionConflictError()

    const task = await this.tasksRepository.move(taskId, userId, {
      column,
      position: newPosition,
    })
    return { task }
  }

  private async findPositionCollision(
    userId: string,
    column: TaskColumn,
    position: string,
    excludeId: string,
  ): Promise<boolean> {
    const tasks = await this.tasksRepository.findManyByUserId(userId, { column })
    const newPos = Number(position)
    return tasks.some((t) => t.id !== excludeId && Number(t.position) === newPos)
  }
}
