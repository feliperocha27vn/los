import type {
  AgendaEventExceptionRecord,
  AgendaEventExceptionsRepository,
  CreateAgendaEventExceptionInput,
} from '@repositories/agenda-event-exceptions-repository'

export class InMemoryAgendaEventExceptionsRepository
  implements AgendaEventExceptionsRepository
{
  private exceptions: AgendaEventExceptionRecord[] = []

  async findById(
    exceptionId: string,
    eventId: string,
  ): Promise<AgendaEventExceptionRecord | null> {
    return (
      this.exceptions.find(
        (e) => e.id === exceptionId && e.eventId === eventId,
      ) ?? null
    )
  }

  async findManyByEventId(
    eventId: string,
  ): Promise<AgendaEventExceptionRecord[]> {
    return this.exceptions
      .filter((e) => e.eventId === eventId)
      .sort((a, b) => a.originalDate.localeCompare(b.originalDate))
  }

  async findByEventAndDate(
    eventId: string,
    originalDate: string,
  ): Promise<AgendaEventExceptionRecord | null> {
    return (
      this.exceptions.find(
        (e) => e.eventId === eventId && e.originalDate === originalDate,
      ) ?? null
    )
  }

  async create(
    input: CreateAgendaEventExceptionInput,
  ): Promise<AgendaEventExceptionRecord> {
    const record: AgendaEventExceptionRecord = {
      id: input.id,
      eventId: input.eventId,
      originalDate: input.originalDate,
      action: input.action,
      newStartsAt: input.newStartsAt,
      newEndsAt: input.newEndsAt,
      createdAt: new Date(),
    }
    this.exceptions.push(record)
    return record
  }

  async delete(exceptionId: string, eventId: string): Promise<void> {
    const index = this.exceptions.findIndex(
      (e) => e.id === exceptionId && e.eventId === eventId,
    )
    if (index === -1) throw new Error('AgendaEventException not found')
    this.exceptions.splice(index, 1)
  }
}
