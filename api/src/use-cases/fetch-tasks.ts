import type { TaskColumn, TaskRecord, TasksRepository } from '@repositories/tasks-repository'

interface FetchTasksInput {
  userId: string
  column?: TaskColumn
  search?: string
}

interface FetchTasksOutput {
  tasks: TaskRecord[]
}

export class FetchTasksUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ userId, column, search }: FetchTasksInput): Promise<FetchTasksOutput> {
    const records = await this.tasksRepository.findManyByUserId(userId, {
      column,
      search,
    })

    return { tasks: records }
  }
}
