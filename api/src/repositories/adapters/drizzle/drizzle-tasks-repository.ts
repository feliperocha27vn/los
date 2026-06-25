import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { tasks } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateTaskInput,
  MoveTaskInput,
  TaskColumn,
  TaskRecord,
  TasksRepository,
  UpdateTaskInput,
} from '@repositories/tasks-repository'

function toRecord(row: typeof tasks.$inferSelect): TaskRecord {
  return {
    id: row.id,
    userId: row.userId,
    column: row.column,
    title: row.title,
    description: row.description,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleTasksRepository implements TasksRepository {
  async findById(id: string, userId: string): Promise<TaskRecord | null> {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { column?: TaskColumn; search?: string }
  ): Promise<TaskRecord[]> {
    const conditions = [eq(tasks.userId, userId)]

    if (filters?.column) {
      conditions.push(eq(tasks.column, filters.column))
    }

    if (filters?.search) {
      const term = `%${filters.search}%`
      conditions.push(
        or(ilike(tasks.title, term), ilike(tasks.description, term))!
      )
    }

    const rows = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.column), asc(tasks.position))

    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.userId, userId))
    return rows.length
  }

  async create(input: CreateTaskInput): Promise<TaskRecord> {
    const [row] = await db.insert(tasks).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateTaskInput
  ): Promise<TaskRecord> {
    const [row] = await db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
    if (!row) throw new Error('Task not found')
    return toRecord(row)
  }

  async move(
    id: string,
    userId: string,
    input: MoveTaskInput
  ): Promise<TaskRecord> {
    const [row] = await db
      .update(tasks)
      .set({
        column: input.column,
        position: input.position,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
    if (!row) throw new Error('Task not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    if (result.count === 0) throw new Error('Task not found')
  }
}

export const tasksRepository = new DrizzleTasksRepository()
