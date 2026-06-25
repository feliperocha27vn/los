export type TaskColumn = 'todo' | 'in_progress' | 'done'

export interface TaskRecord {
  id: string
  userId: string
  column: TaskColumn
  title: string
  description: string | null
  position: string
  createdAt: Date
  updatedAt: Date
}

export type CreateTaskInput = Pick<
  TaskRecord,
  'id' | 'userId' | 'column' | 'title' | 'position'
> & {
  description?: string | null
}

export type UpdateTaskInput = Partial<Pick<TaskRecord, 'title' | 'description'>>

export type MoveTaskInput = Pick<TaskRecord, 'column' | 'position'>

export interface TasksRepository {
  findById(id: string, userId: string): Promise<TaskRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { column?: TaskColumn; search?: string },
  ): Promise<TaskRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateTaskInput): Promise<TaskRecord>
  update(id: string, userId: string, input: UpdateTaskInput): Promise<TaskRecord>
  move(id: string, userId: string, input: MoveTaskInput): Promise<TaskRecord>
  delete(id: string, userId: string): Promise<void>
}
