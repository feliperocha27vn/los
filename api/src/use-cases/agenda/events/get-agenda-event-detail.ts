import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface GetAgendaEventDetailInput {
  userId: string
  eventId: string
}

interface GetAgendaEventDetailOutput {
  event: Awaited<ReturnType<AgendaEventsRepository['findById']>>
  exceptions: Awaited<
    ReturnType<AgendaEventExceptionsRepository['findManyByEventId']>
  >
}

export class GetAgendaEventDetailUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: GetAgendaEventDetailInput,
  ): Promise<GetAgendaEventDetailOutput> {
    const event = await this.agendaEventsRepository.findById(
      input.eventId,
      input.userId,
    )
    if (!event) throw new ResourceNotFoundError()

    const exceptions = await this.agendaEventExceptionsRepository.findManyByEventId(
      event.id,
    )

    return { event, exceptions }
  }
}
