import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { trackerRecords } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateTrackerRecordInput,
  TrackerRecordRecord,
  TrackerRecordsRepository,
  UpdateTrackerRecordInput,
} from '@repositories/tracker-records-repository'

function toRecord(row: typeof trackerRecords.$inferSelect): TrackerRecordRecord {
  return {
    id: row.id,
    habitId: row.habitId,
    userId: row.userId,
    date: row.date,
    completed: row.completed,
    energy: row.energy as TrackerRecordRecord['energy'],
    quality: row.quality as TrackerRecordRecord['quality'],
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleTrackerRecordsRepository implements TrackerRecordsRepository {
  async findById(id: string, userId: string): Promise<TrackerRecordRecord | null> {
    const rows = await db
      .select()
      .from(trackerRecords)
      .where(and(eq(trackerRecords.id, id), eq(trackerRecords.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findByHabitAndDate(
    habitId: string,
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord | null> {
    const rows = await db
      .select()
      .from(trackerRecords)
      .where(
        and(
          eq(trackerRecords.habitId, habitId),
          eq(trackerRecords.userId, userId),
          eq(trackerRecords.date, date),
        ),
      )
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string; habitId?: string },
  ): Promise<TrackerRecordRecord[]> {
    const conditions = [eq(trackerRecords.userId, userId)]
    if (filters?.from) conditions.push(gte(trackerRecords.date, filters.from))
    if (filters?.to) conditions.push(lte(trackerRecords.date, filters.to))
    if (filters?.habitId) conditions.push(eq(trackerRecords.habitId, filters.habitId))

    const rows = await db
      .select()
      .from(trackerRecords)
      .where(and(...conditions))
      .orderBy(asc(trackerRecords.date))
    return rows.map(toRecord)
  }

  async findManyByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord[]> {
    const rows = await db
      .select()
      .from(trackerRecords)
      .where(and(eq(trackerRecords.userId, userId), eq(trackerRecords.date, date)))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: trackerRecords.id })
      .from(trackerRecords)
      .where(eq(trackerRecords.userId, userId))
    return rows.length
  }

  async create(input: CreateTrackerRecordInput): Promise<TrackerRecordRecord> {
    const [row] = await db.insert(trackerRecords).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateTrackerRecordInput,
  ): Promise<TrackerRecordRecord> {
    const [row] = await db
      .update(trackerRecords)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(trackerRecords.id, id), eq(trackerRecords.userId, userId)))
      .returning()
    if (!row) throw new Error('TrackerRecord not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(trackerRecords)
      .where(and(eq(trackerRecords.id, id), eq(trackerRecords.userId, userId)))
    if (result.count === 0) throw new Error('TrackerRecord not found')
  }
}

export const trackerRecordsRepository = new DrizzleTrackerRecordsRepository()
