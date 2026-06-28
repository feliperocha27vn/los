import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

interface DeleteAgendaCalendarInput {
  userId: string
  calendarId: string
}

export class DeleteAgendaCalendarUseCase {
  constructor(
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(input: DeleteAgendaCalendarInput): Promise<void> {
    try {
      await this.agendaCalendarsRepository.delete(
        input.calendarId,
        input.userId,
      )
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
