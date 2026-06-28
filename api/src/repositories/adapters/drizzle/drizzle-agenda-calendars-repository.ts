import { and, asc, eq } from 'drizzle-orm'
import { agendaCalendars } from '@db/schema'
import { db } from '@lib/db'
import type {
  AgendaCalendarRecord,
  AgendaCalendarsRepository,
  CreateAgendaCalendarInput,
  UpdateAgendaCalendarInput,
} from '@repositories/agenda-calendars-repository'

function toRecord(
  row: typeof agendaCalendars.$inferSelect,
): AgendaCalendarRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleAgendaCalendarsRepository implements AgendaCalendarsRepository {
  async findById(
    id: string,
    userId: string,
  ): Promise<AgendaCalendarRecord | null> {
    const rows = await db
      .select()
      .from(agendaCalendars)
      .where(
        and(eq(agendaCalendars.id, id), eq(agendaCalendars.userId, userId)),
      )
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(userId: string): Promise<AgendaCalendarRecord[]> {
    const rows = await db
      .select()
      .from(agendaCalendars)
      .where(eq(agendaCalendars.userId, userId))
      .orderBy(asc(agendaCalendars.name))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: agendaCalendars.id })
      .from(agendaCalendars)
      .where(eq(agendaCalendars.userId, userId))
    return rows.length
  }

  async create(
    input: CreateAgendaCalendarInput,
  ): Promise<AgendaCalendarRecord> {
    const [row] = await db.insert(agendaCalendars).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateAgendaCalendarInput,
  ): Promise<AgendaCalendarRecord> {
    const [row] = await db
      .update(agendaCalendars)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(eq(agendaCalendars.id, id), eq(agendaCalendars.userId, userId)),
      )
      .returning()
    if (!row) throw new Error('AgendaCalendar not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(agendaCalendars)
      .where(
        and(eq(agendaCalendars.id, id), eq(agendaCalendars.userId, userId)),
      )
    if (result.count === 0) throw new Error('AgendaCalendar not found')
  }
}

export const agendaCalendarsRepository = new DrizzleAgendaCalendarsRepository()
