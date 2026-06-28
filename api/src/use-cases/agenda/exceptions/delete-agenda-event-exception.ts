import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface DeleteAgendaEventExceptionInput {
  userId: string
  eventId: string
  exceptionId: string
}

export class DeleteAgendaEventExceptionUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  ) {}

  async execute(
    input: DeleteAgendaEventExceptionInput,
  ): Promise<void> {
    const event = await this.agendaEventsRepository.findById(
      input.eventId,
      input.userId,
    )
    if (!event) throw new ResourceNotFoundError()
    try {
      await this.agendaEventExceptionsRepository.delete(
        input.exceptionId,
        input.eventId,
      )
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
