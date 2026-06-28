import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

const MAX_NAME_LENGTH = 50
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

interface UpdateAgendaCalendarInput {
  userId: string
  calendarId: string
  name?: string
  color?: string
}

interface UpdateAgendaCalendarOutput {
  calendar: Awaited<
    ReturnType<AgendaCalendarsRepository['update']>
  >
}

export class UpdateAgendaCalendarUseCase {
  constructor(
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: UpdateAgendaCalendarInput,
  ): Promise<UpdateAgendaCalendarOutput> {
    if (input.name === undefined && input.color === undefined) {
      throw new Error('Nenhum campo para atualizar')
    }
    if (input.name !== undefined) {
      if (input.name.length < 1 || input.name.length > MAX_NAME_LENGTH) {
        throw new Error(
          `name deve ter entre 1 e ${MAX_NAME_LENGTH} caracteres`,
        )
      }
    }
    if (input.color !== undefined && !HEX_COLOR_REGEX.test(input.color)) {
      throw new Error('color deve ser hex (#xxxxxx)')
    }

    try {
      const calendar = await this.agendaCalendarsRepository.update(
        input.calendarId,
        input.userId,
        {
          name: input.name,
          color: input.color,
        },
      )
      return { calendar }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
