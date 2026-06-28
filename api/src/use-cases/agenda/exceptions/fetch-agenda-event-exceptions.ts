import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface FetchAgendaEventExceptionsInput {
  userId: string
  eventId: string
}

interface FetchAgendaEventExceptionsOutput {
  exceptions: Awaited<
    ReturnType<AgendaEventExceptionsRepository['findManyByEventId']>
  >
}

export class FetchAgendaEventExceptionsUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  ) {}

  async execute(
    input: FetchAgendaEventExceptionsInput,
  ): Promise<FetchAgendaEventExceptionsOutput> {
    const event = await this.agendaEventsRepository.findById(
      input.eventId,
      input.userId,
    )
    if (!event) throw new ResourceNotFoundError()
    const exceptions = await this.agendaEventExceptionsRepository.findManyByEventId(
      event.id,
    )
    return { exceptions }
  }
}
