import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { AgendaEventLimitExceededError } from '@errors/agenda-event-limit-exceeded-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type {
  AgendaEventRecurrence,
  AgendaEventsRepository,
  AgendaEventStatus,
  CreateAgendaEventInput,
} from '@repositories/agenda-events-repository'

const EVENT_LIMIT_PER_USER = 2000
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_LOCATION_LENGTH = 200
const MAX_RECURRENCE_YEARS = 2
const VALID_RECURRENCES: AgendaEventRecurrence[] = [
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
]

interface CreateAgendaEventInputUC {
  userId: string
  title: string
  description?: string | null
  location?: string | null
  calendarId: string
  startAt: Date
  endAt: Date
  allDay?: boolean
  recurrence?: AgendaEventRecurrence
  recurrenceInterval?: number
  recurrenceCount?: number | null
  recurrenceEndsAt?: Date | null
}

interface CreateAgendaEventOutput {
  event: Awaited<ReturnType<AgendaEventsRepository['create']>>
}

export class CreateAgendaEventUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: CreateAgendaEventInputUC,
  ): Promise<CreateAgendaEventOutput> {
    if (input.title.length < 1 || input.title.length > MAX_TITLE_LENGTH) {
      throw new Error(
        `title deve ter entre 1 e ${MAX_TITLE_LENGTH} caracteres`,
      )
    }
    if (
      input.description &&
      input.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `description máximo ${MAX_DESCRIPTION_LENGTH} caracteres`,
      )
    }
    if (input.location && input.location.length > MAX_LOCATION_LENGTH) {
      throw new Error(`location máximo ${MAX_LOCATION_LENGTH} caracteres`)
    }
    if (input.endAt <= input.startAt) {
      throw new Error('endAt deve ser maior que startAt')
    }

    const recurrence = input.recurrence ?? 'none'
    if (!VALID_RECURRENCES.includes(recurrence)) {
      throw new Error(`recurrence inválida: ${recurrence}`)
    }

    const interval = input.recurrenceInterval ?? 1
    if (recurrence !== 'none') {
      if (!Number.isInteger(interval) || interval < 1 || interval > 12) {
        throw new Error('recurrenceInterval deve estar entre 1 e 12')
      }
      if (
        input.recurrenceCount !== undefined &&
        input.recurrenceCount !== null &&
        (!Number.isInteger(input.recurrenceCount) ||
          input.recurrenceCount < 1 ||
          input.recurrenceCount > 365)
      ) {
        throw new Error('recurrenceCount deve estar entre 1 e 365')
      }
      if (
        input.recurrenceCount !== undefined &&
        input.recurrenceCount !== null &&
        input.recurrenceEndsAt !== undefined &&
        input.recurrenceEndsAt !== null
      ) {
        throw new Error(
          'Use apenas recurrenceCount OU recurrenceEndsAt, não ambos',
        )
      }
      if (input.recurrenceEndsAt) {
        const maxEnd = new Date(input.startAt)
        maxEnd.setUTCFullYear(
          maxEnd.getUTCFullYear() + MAX_RECURRENCE_YEARS,
        )
        if (input.recurrenceEndsAt > maxEnd) {
          throw new Error(
            `recurrenceEndsAt não pode ser mais que ${MAX_RECURRENCE_YEARS} anos no futuro`,
          )
        }
      }
    }

    const calendar = await this.agendaCalendarsRepository.findById(
      input.calendarId,
      input.userId,
    )
    if (!calendar) throw new ResourceNotFoundError()

    const count = await this.agendaEventsRepository.countByUserId(input.userId)
    if (count >= EVENT_LIMIT_PER_USER) {
      throw new AgendaEventLimitExceededError()
    }

    const createInput: CreateAgendaEventInput = {
      id: randomUUID(),
      userId: input.userId,
      calendarId: input.calendarId,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay ?? false,
      recurrence,
      recurrenceInterval: interval,
      recurrenceCount:
        recurrence === 'none' ? null : (input.recurrenceCount ?? null),
      recurrenceEndsAt:
        recurrence === 'none' ? null : (input.recurrenceEndsAt ?? null),
    }
    const event = await this.agendaEventsRepository.create(createInput)
    return { event }
  }
}

export type { AgendaEventStatus }
