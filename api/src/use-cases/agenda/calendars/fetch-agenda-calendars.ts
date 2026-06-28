import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

interface FetchAgendaCalendarsInput {
  userId: string
}

interface FetchAgendaCalendarsOutput {
  calendars: Awaited<
    ReturnType<AgendaCalendarsRepository['findManyByUserId']>
  >
}

export class FetchAgendaCalendarsUseCase {
  constructor(
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: FetchAgendaCalendarsInput,
  ): Promise<FetchAgendaCalendarsOutput> {
    const calendars = await this.agendaCalendarsRepository.findManyByUserId(
      input.userId,
    )
    return { calendars }
  }
}
