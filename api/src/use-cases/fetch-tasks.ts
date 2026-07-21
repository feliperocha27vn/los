import type {
  TaskCategory,
  TaskColumn,
  TaskRecord,
  TasksRepository,
} from '@repositories/tasks-repository'

interface FetchTasksInput {
  userId: string
  column?: TaskColumn
  category?: TaskCategory
  search?: string
}

interface FetchTasksOutput {
  tasks: TaskRecord[]
}

export class FetchTasksUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ userId, column, category, search }: FetchTasksInput): Promise<FetchTasksOutput> {
    const records = await this.tasksRepository.findManyByUserId(userId, {
      column,
      category,
      search,
    })

    return { tasks: records }
  }
}
