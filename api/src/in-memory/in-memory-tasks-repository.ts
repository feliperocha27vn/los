import type {
  CreateTaskInput,
  MoveTaskInput,
  TaskColumn,
  TaskRecord,
  TasksRepository,
  UpdateTaskInput,
} from '@repositories/tasks-repository'

export class InMemoryTasksRepository implements TasksRepository {
  private tasks: TaskRecord[] = []

  async findById(id: string, userId: string): Promise<TaskRecord | null> {
    return this.tasks.find((t) => t.id === id && t.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { column?: TaskColumn; search?: string },
  ): Promise<TaskRecord[]> {
    let result = this.tasks.filter((t) => t.userId === userId)

    if (filters?.column) {
      result = result.filter((t) => t.column === filters.column)
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description?.toLowerCase().includes(term) ?? false),
      )
    }

    return result
  }

  async countByUserId(userId: string): Promise<number> {
    return this.tasks.filter((t) => t.userId === userId).length
  }

  async create(input: CreateTaskInput): Promise<TaskRecord> {
    const task: TaskRecord = {
      id: input.id,
      userId: input.userId,
      column: input.column,
      title: input.title,
      description: input.description ?? null,
      position: input.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.tasks.push(task)
    return task
  }

  async update(id: string, userId: string, input: UpdateTaskInput): Promise<TaskRecord> {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId)
    if (!task) throw new Error('Task not found')
    if (input.title !== undefined) task.title = input.title
    if (input.description !== undefined) task.description = input.description
    task.updatedAt = new Date()
    return task
  }

  async move(id: string, userId: string, input: MoveTaskInput): Promise<TaskRecord> {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId)
    if (!task) throw new Error('Task not found')

    const collides = this.tasks.some(
      (t) =>
        t.userId === userId &&
        t.column === input.column &&
        t.id !== id &&
        t.position === input.position,
    )
    if (collides) throw new Error('Position conflict')

    task.column = input.column
    task.position = input.position
    task.updatedAt = new Date()
    return task
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.tasks.findIndex((t) => t.id === id && t.userId === userId)
    if (index === -1) throw new Error('Task not found')
    this.tasks.splice(index, 1)
  }
}
