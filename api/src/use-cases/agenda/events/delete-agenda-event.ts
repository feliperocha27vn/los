import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface DeleteAgendaEventInput {
  userId: string
  eventId: string
}

export class DeleteAgendaEventUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
  ) {}

  async execute(input: DeleteAgendaEventInput): Promise<void> {
    try {
      await this.agendaEventsRepository.delete(input.eventId, input.userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
