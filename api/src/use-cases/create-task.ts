import { randomUUID } from 'node:crypto'
import { TaskLimitExceededError } from '@errors/task-limit-exceeded-error'
import type { TaskColumn, TaskRecord, TasksRepository } from '@repositories/tasks-repository'

const TASK_LIMIT_PER_USER = 500
const POSITION_STEP = 1.0

interface CreateTaskInput {
  userId: string
  title: string
  description?: string | null
  column?: TaskColumn
}

interface CreateTaskOutput {
  task: TaskRecord
}

export class CreateTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({
    userId,
    title,
    description,
    column = 'todo',
  }: CreateTaskInput): Promise<CreateTaskOutput> {
    const count = await this.tasksRepository.countByUserId(userId)
    if (count >= TASK_LIMIT_PER_USER) {
      throw new TaskLimitExceededError()
    }

    const columnTasks = await this.tasksRepository.findManyByUserId(userId, {
      column,
    })
    const maxPosition = columnTasks.reduce((max, t) => {
      const n = Number(t.position)
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const nextPosition = (maxPosition + POSITION_STEP).toFixed(10)

    const task = await this.tasksRepository.create({
      id: randomUUID(),
      userId,
      column,
      title,
      description: description ?? null,
      position: nextPosition,
    })

    return { task }
  }
}
