import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { AgendaExceptionAlreadyExistsError } from '@errors/agenda-exception-already-exists-error'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

interface CreateAgendaEventExceptionInput {
  userId: string
  eventId: string
  originalDate: string
  action: 'cancel' | 'reschedule'
  newStartsAt?: Date | null
  newEndsAt?: Date | null
}

interface CreateAgendaEventExceptionOutput {
  exception: Awaited<
    ReturnType<AgendaEventExceptionsRepository['create']>
  >
}

export class CreateAgendaEventExceptionUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  ) {}

  async execute(
    input: CreateAgendaEventExceptionInput,
  ): Promise<CreateAgendaEventExceptionOutput> {
    const event = await this.agendaEventsRepository.findById(
      input.eventId,
      input.userId,
    )
    if (!event) throw new ResourceNotFoundError()

    if (input.action === 'cancel') {
      if (input.newStartsAt || input.newEndsAt) {
        throw new Error(
          'newStartsAt/newEndsAt devem ser nulos quando action=cancel',
        )
      }
    } else if (input.action === 'reschedule') {
      if (!input.newStartsAt || !input.newEndsAt) {
        throw new Error(
          'newStartsAt e newEndsAt são obrigatórios quando action=reschedule',
        )
      }
      if (input.newEndsAt <= input.newStartsAt) {
        throw new Error('newEndsAt deve ser maior que newStartsAt')
      }
    } else {
      throw new Error(`action inválida: ${input.action}`)
    }

    const existing = await this.agendaEventExceptionsRepository.findByEventAndDate(
      input.eventId,
      input.originalDate,
    )
    if (existing) throw new AgendaExceptionAlreadyExistsError()

    const exception = await this.agendaEventExceptionsRepository.create({
      id: randomUUID(),
      eventId: input.eventId,
      originalDate: input.originalDate,
      action: input.action,
      newStartsAt: input.newStartsAt ?? null,
      newEndsAt: input.newEndsAt ?? null,
    })
    return { exception }
  }
}
