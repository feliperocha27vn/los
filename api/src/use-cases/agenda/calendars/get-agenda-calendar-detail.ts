import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

interface GetAgendaCalendarDetailInput {
  userId: string
  calendarId: string
}

interface GetAgendaCalendarDetailOutput {
  calendar: Awaited<
    ReturnType<AgendaCalendarsRepository['findById']>
  >
}

export class GetAgendaCalendarDetailUseCase {
  constructor(
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: GetAgendaCalendarDetailInput,
  ): Promise<GetAgendaCalendarDetailOutput> {
    const calendar = await this.agendaCalendarsRepository.findById(
      input.calendarId,
      input.userId,
    )
    if (!calendar) throw new ResourceNotFoundError()
    return { calendar }
  }
}
