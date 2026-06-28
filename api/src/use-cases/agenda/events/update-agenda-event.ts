import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type {
  AgendaEventRecurrence,
  AgendaEventsRepository,
  UpdateAgendaEventInput,
} from '@repositories/agenda-events-repository'

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

interface UpdateAgendaEventInputUC {
  userId: string
  eventId: string
  title?: string
  description?: string | null
  location?: string | null
  calendarId?: string
  startAt?: Date
  endAt?: Date
  allDay?: boolean
  recurrence?: AgendaEventRecurrence
  recurrenceInterval?: number
  recurrenceCount?: number | null
  recurrenceEndsAt?: Date | null
}

interface UpdateAgendaEventOutput {
  event: Awaited<ReturnType<AgendaEventsRepository['update']>>
}

export class UpdateAgendaEventUseCase {
  constructor(
    private readonly agendaEventsRepository: AgendaEventsRepository,
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: UpdateAgendaEventInputUC,
  ): Promise<UpdateAgendaEventOutput> {
    const hasAny =
      input.title !== undefined ||
      input.description !== undefined ||
      input.location !== undefined ||
      input.calendarId !== undefined ||
      input.startAt !== undefined ||
      input.endAt !== undefined ||
      input.allDay !== undefined ||
      input.recurrence !== undefined ||
      input.recurrenceInterval !== undefined ||
      input.recurrenceCount !== undefined ||
      input.recurrenceEndsAt !== undefined
    if (!hasAny) throw new Error('Nenhum campo para atualizar')

    if (input.title !== undefined) {
      if (input.title.length < 1 || input.title.length > MAX_TITLE_LENGTH) {
        throw new Error(
          `title deve ter entre 1 e ${MAX_TITLE_LENGTH} caracteres`,
        )
      }
    }
    if (
      input.description !== undefined &&
      input.description !== null &&
      input.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `description máximo ${MAX_DESCRIPTION_LENGTH} caracteres`,
      )
    }
    if (
      input.location !== undefined &&
      input.location !== null &&
      input.location.length > MAX_LOCATION_LENGTH
    ) {
      throw new Error(`location máximo ${MAX_LOCATION_LENGTH} caracteres`)
    }
    if (
      input.startAt !== undefined &&
      input.endAt !== undefined &&
      input.endAt <= input.startAt
    ) {
      throw new Error('endAt deve ser maior que startAt')
    }
    if (
      input.recurrence !== undefined &&
      !VALID_RECURRENCES.includes(input.recurrence)
    ) {
      throw new Error(`recurrence inválida: ${input.recurrence}`)
    }
    if (input.recurrenceInterval !== undefined) {
      if (
        !Number.isInteger(input.recurrenceInterval) ||
        input.recurrenceInterval < 1 ||
        input.recurrenceInterval > 12
      ) {
        throw new Error('recurrenceInterval deve estar entre 1 e 12')
      }
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

    if (input.calendarId) {
      const calendar = await this.agendaCalendarsRepository.findById(
        input.calendarId,
        input.userId,
      )
      if (!calendar) throw new ResourceNotFoundError()
    }

    if (input.recurrenceEndsAt) {
      const existing = await this.agendaEventsRepository.findById(
        input.eventId,
        input.userId,
      )
      if (!existing) throw new ResourceNotFoundError()
      const baseStart = input.startAt ?? existing.startAt
      const maxEnd = new Date(baseStart)
      maxEnd.setUTCFullYear(maxEnd.getUTCFullYear() + MAX_RECURRENCE_YEARS)
      if (input.recurrenceEndsAt > maxEnd) {
        throw new Error(
          `recurrenceEndsAt não pode ser mais que ${MAX_RECURRENCE_YEARS} anos no futuro`,
        )
      }
    }

    const updateInput: UpdateAgendaEventInput = {
      title: input.title,
      description: input.description,
      location: input.location,
      calendarId: input.calendarId,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      recurrence: input.recurrence,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceCount: input.recurrenceCount,
      recurrenceEndsAt: input.recurrenceEndsAt,
    }
    try {
      const event = await this.agendaEventsRepository.update(
        input.eventId,
        input.userId,
        updateInput,
      )
      return { event }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
