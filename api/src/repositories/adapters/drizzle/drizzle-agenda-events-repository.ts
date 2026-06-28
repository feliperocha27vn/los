import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import { agendaEvents } from '@db/schema'
import { db } from '@lib/db'
import type {
  AgendaEventRecurrence,
  AgendaEventRecord,
  AgendaEventsRepository,
  AgendaEventStatus,
  CreateAgendaEventInput,
  UpdateAgendaEventInput,
} from '@repositories/agenda-events-repository'

function toRecord(
  row: typeof agendaEvents.$inferSelect,
): AgendaEventRecord {
  return {
    id: row.id,
    userId: row.userId,
    calendarId: row.calendarId,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.startAt,
    endAt: row.endAt,
    allDay: row.allDay,
    recurrence: row.recurrence as AgendaEventRecurrence,
    recurrenceInterval: row.recurrenceInterval,
    recurrenceCount: row.recurrenceCount,
    recurrenceEndsAt: row.recurrenceEndsAt,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleAgendaEventsRepository implements AgendaEventsRepository {
  async findById(
    id: string,
    userId: string,
  ): Promise<AgendaEventRecord | null> {
    const rows = await db
      .select()
      .from(agendaEvents)
      .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: Date; to?: Date; calendarIds?: string[] },
  ): Promise<AgendaEventRecord[]> {
    const conditions = [eq(agendaEvents.userId, userId)]
    if (filters?.from) conditions.push(gte(agendaEvents.endAt, filters.from))
    if (filters?.to) conditions.push(lte(agendaEvents.startAt, filters.to))
    if (filters?.calendarIds && filters.calendarIds.length > 0) {
      conditions.push(inArray(agendaEvents.calendarId, filters.calendarIds))
    }
    const rows = await db
      .select()
      .from(agendaEvents)
      .where(and(...conditions))
      .orderBy(asc(agendaEvents.startAt))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: agendaEvents.id })
      .from(agendaEvents)
      .where(eq(agendaEvents.userId, userId))
    return rows.length
  }

  async create(input: CreateAgendaEventInput): Promise<AgendaEventRecord> {
    const [row] = await db.insert(agendaEvents).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEventRecord> {
    const [row] = await db
      .update(agendaEvents)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
      .returning()
    if (!row) throw new Error('AgendaEvent not found')
    return toRecord(row)
  }

  async updateStatus(
    id: string,
    userId: string,
    status: AgendaEventStatus,
  ): Promise<AgendaEventRecord> {
    const [row] = await db
      .update(agendaEvents)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
      .returning()
    if (!row) throw new Error('AgendaEvent not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(agendaEvents)
      .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
    if (result.count === 0) throw new Error('AgendaEvent not found')
  }
}

export const agendaEventsRepository = new DrizzleAgendaEventsRepository()
