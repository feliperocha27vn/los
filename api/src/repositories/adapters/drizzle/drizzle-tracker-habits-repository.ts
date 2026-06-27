import { and, asc, eq } from 'drizzle-orm'
import { trackerHabits } from '@db/schema'
import { db } from '@lib/db'
import type {
  ArchiveTrackerHabitInput,
  CreateTrackerHabitInput,
  ReorderTrackerHabitInput,
  TrackerHabitRecord,
  TrackerHabitsRepository,
  UpdateTrackerHabitInput,
} from '@repositories/tracker-habits-repository'

function toRecord(row: typeof trackerHabits.$inferSelect): TrackerHabitRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    icon: row.icon,
    position: row.position,
    archived: row.archived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleTrackerHabitsRepository implements TrackerHabitsRepository {
  async findById(id: string, userId: string): Promise<TrackerHabitRecord | null> {
    const rows = await db
      .select()
      .from(trackerHabits)
      .where(and(eq(trackerHabits.id, id), eq(trackerHabits.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { includeArchived?: boolean },
  ): Promise<TrackerHabitRecord[]> {
    const conditions = [eq(trackerHabits.userId, userId)]
    if (!filters?.includeArchived) {
      conditions.push(eq(trackerHabits.archived, false))
    }
    const rows = await db
      .select()
      .from(trackerHabits)
      .where(and(...conditions))
      .orderBy(asc(trackerHabits.position))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: trackerHabits.id })
      .from(trackerHabits)
      .where(eq(trackerHabits.userId, userId))
    return rows.length
  }

  async create(input: CreateTrackerHabitInput): Promise<TrackerHabitRecord> {
    const [row] = await db.insert(trackerHabits).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const [row] = await db
      .update(trackerHabits)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(trackerHabits.id, id), eq(trackerHabits.userId, userId)))
      .returning()
    if (!row) throw new Error('TrackerHabit not found')
    return toRecord(row)
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const [row] = await db
      .update(trackerHabits)
      .set({ position: input.position, updatedAt: new Date() })
      .where(and(eq(trackerHabits.id, id), eq(trackerHabits.userId, userId)))
      .returning()
    if (!row) throw new Error('TrackerHabit not found')
    return toRecord(row)
  }

  async setArchived(
    id: string,
    userId: string,
    input: ArchiveTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const [row] = await db
      .update(trackerHabits)
      .set({ archived: input.archived, updatedAt: new Date() })
      .where(and(eq(trackerHabits.id, id), eq(trackerHabits.userId, userId)))
      .returning()
    if (!row) throw new Error('TrackerHabit not found')
    return toRecord(row)
  }
}

export const trackerHabitsRepository = new DrizzleTrackerHabitsRepository()
