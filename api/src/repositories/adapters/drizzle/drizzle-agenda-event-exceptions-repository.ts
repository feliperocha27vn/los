import { and, asc, eq } from 'drizzle-orm'
import { agendaEventExceptions } from '@db/schema'
import { db } from '@lib/db'
import type {
  AgendaEventExceptionRecord,
  AgendaEventExceptionsRepository,
  CreateAgendaEventExceptionInput,
} from '@repositories/agenda-event-exceptions-repository'

function toRecord(
  row: typeof agendaEventExceptions.$inferSelect,
): AgendaEventExceptionRecord {
  return {
    id: row.id,
    eventId: row.eventId,
    originalDate: row.originalDate,
    action: row.action,
    newStartsAt: row.newStartsAt,
    newEndsAt: row.newEndsAt,
    createdAt: row.createdAt,
  }
}

class DrizzleAgendaEventExceptionsRepository
  implements AgendaEventExceptionsRepository
{
  async findById(
    exceptionId: string,
    eventId: string,
  ): Promise<AgendaEventExceptionRecord | null> {
    const rows = await db
      .select()
      .from(agendaEventExceptions)
      .where(
        and(
          eq(agendaEventExceptions.id, exceptionId),
          eq(agendaEventExceptions.eventId, eventId),
        ),
      )
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByEventId(
    eventId: string,
  ): Promise<AgendaEventExceptionRecord[]> {
    const rows = await db
      .select()
      .from(agendaEventExceptions)
      .where(eq(agendaEventExceptions.eventId, eventId))
      .orderBy(asc(agendaEventExceptions.originalDate))
    return rows.map(toRecord)
  }

  async findByEventAndDate(
    eventId: string,
    originalDate: string,
  ): Promise<AgendaEventExceptionRecord | null> {
    const rows = await db
      .select()
      .from(agendaEventExceptions)
      .where(
        and(
          eq(agendaEventExceptions.eventId, eventId),
          eq(agendaEventExceptions.originalDate, originalDate),
        ),
      )
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async create(
    input: CreateAgendaEventExceptionInput,
  ): Promise<AgendaEventExceptionRecord> {
    const [row] = await db
      .insert(agendaEventExceptions)
      .values(input)
      .returning()
    return toRecord(row)
  }

  async delete(exceptionId: string, eventId: string): Promise<void> {
    const result = await db
      .delete(agendaEventExceptions)
      .where(
        and(
          eq(agendaEventExceptions.id, exceptionId),
          eq(agendaEventExceptions.eventId, eventId),
        ),
      )
    if (result.count === 0) throw new Error('AgendaEventException not found')
  }
}

export const agendaEventExceptionsRepository =
  new DrizzleAgendaEventExceptionsRepository()
