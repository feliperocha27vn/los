import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type {
  AgendaEventRecord,
  AgendaEventStatus,
  AgendaEventsRepository,
} from '@repositories/agenda-events-repository'
import { expandRecurrence } from '../rrule/expand-recurrence'

interface FetchAgendaEventsInput {
  userId: string
  from?: Date
  to?: Date
  calendarIds?: string[]
  status?: AgendaEventStatus
}

interface ExpandedEvent {
  id: string
  eventId: string
  title: string
  description: string | null
  location: string | null
  calendarId: string
  startAt: Date
  endAt: Date
  allDay: boolean
  recurrence: string
  isRecurring: boolean
  status: AgendaEventStatus
  isException: boolean
}

const DEFAULT_RANGE_DAYS = 30

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export class FetchAgendaEventsUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: FetchAgendaEventsInput,
  ): Promise<{ events: ExpandedEvent[] }> {
    const now = new Date()
    const from = input.from ?? startOfDayUTC(now)
    const to = input.to ?? addDays(from, DEFAULT_RANGE_DAYS)

    const events = await this.agendaEventsRepository.findManyByUserId(
      input.userId,
      { from, to, calendarIds: input.calendarIds },
    )

    const filtered = input.status
      ? events.filter((e) => e.status === input.status)
      : events.filter((e) => e.status === 'scheduled')

    const result: ExpandedEvent[] = []

    for (const event of filtered) {
      const exceptions = await this.agendaEventExceptionsRepository.findManyByEventId(
        event.id,
      )
      const exceptionMap = new Map<
        string,
        { action: 'cancel' | 'reschedule'; newStartsAt: Date | null; newEndsAt: Date | null }
      >()
      for (const ex of exceptions) {
        exceptionMap.set(ex.originalDate, {
          action: ex.action,
          newStartsAt: ex.newStartsAt,
          newEndsAt: ex.newEndsAt,
        })
      }

      const occurrences = expandRecurrence(
        event,
        { from, to },
        exceptionMap,
      )

      for (const occ of occurrences) {
        result.push({
          id: event.id,
          eventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          calendarId: event.calendarId,
          startAt: occ.startAt,
          endAt: occ.endAt,
          allDay: event.allDay,
          recurrence: event.recurrence,
          isRecurring: event.recurrence !== 'none',
          status: event.status,
          isException: occ.isException,
        })
      }
    }

    result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    return { events: result }
  }
}

export type { ExpandedEvent, AgendaEventRecord }
