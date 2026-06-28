import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface UpdateAgendaEventStatusInput {
  userId: string
  eventId: string
  status: 'scheduled' | 'done' | 'cancelled'
}

interface UpdateAgendaEventStatusOutput {
  event: Awaited<ReturnType<AgendaEventsRepository['updateStatus']>>
}

const VALID_STATUSES = ['scheduled', 'done', 'cancelled'] as const

export class UpdateAgendaEventStatusUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
  ) {}

  async execute(
    input: UpdateAgendaEventStatusInput,
  ): Promise<UpdateAgendaEventStatusOutput> {
    if (!VALID_STATUSES.includes(input.status)) {
      throw new Error(`status inválido: ${input.status}`)
    }
    try {
      const event = await this.agendaEventsRepository.updateStatus(
        input.eventId,
        input.userId,
        input.status,
      )
      return { event }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
