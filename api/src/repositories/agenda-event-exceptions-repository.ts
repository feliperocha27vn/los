export type AgendaExceptionAction = 'cancel' | 'reschedule'

export interface AgendaEventExceptionRecord {
  id: string
  eventId: string
  originalDate: string
  action: AgendaExceptionAction
  newStartsAt: Date | null
  newEndsAt: Date | null
  createdAt: Date
}

export type CreateAgendaEventExceptionInput = Pick<
  AgendaEventExceptionRecord,
  'id' | 'eventId' | 'originalDate' | 'action'
> & {
  newStartsAt: Date | null
  newEndsAt: Date | null
}

export interface AgendaEventExceptionsRepository {
  findById(
    exceptionId: string,
    eventId: string,
  ): Promise<AgendaEventExceptionRecord | null>
  findManyByEventId(eventId: string): Promise<AgendaEventExceptionRecord[]>
  findByEventAndDate(
    eventId: string,
    originalDate: string,
  ): Promise<AgendaEventExceptionRecord | null>
  create(
    input: CreateAgendaEventExceptionInput,
  ): Promise<AgendaEventExceptionRecord>
  delete(exceptionId: string, eventId: string): Promise<void>
}
