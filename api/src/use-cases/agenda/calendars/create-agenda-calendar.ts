import { randomUUID } from 'node:crypto'
import { AgendaCalendarLimitExceededError } from '@errors/agenda-calendar-limit-exceeded-error'
import type {
  AgendaCalendarRecord,
  AgendaCalendarsRepository,
  CreateAgendaCalendarInput,
} from '@repositories/agenda-calendars-repository'

const CALENDAR_LIMIT_PER_USER = 20
const MAX_NAME_LENGTH = 50
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

interface CreateAgendaCalendarInputUC {
  userId: string
  name: string
  color: string
}

interface CreateAgendaCalendarOutput {
  calendar: AgendaCalendarRecord
}

export class CreateAgendaCalendarUseCase {
  constructor(
    private readonly agendaCalendarsRepository: AgendaCalendarsRepository,
  ) {}

  async execute(
    input: CreateAgendaCalendarInputUC,
  ): Promise<CreateAgendaCalendarOutput> {
    if (input.name.length < 1 || input.name.length > MAX_NAME_LENGTH) {
      throw new Error(`name deve ter entre 1 e ${MAX_NAME_LENGTH} caracteres`)
    }
    if (!HEX_COLOR_REGEX.test(input.color)) {
      throw new Error('color deve ser hex (#xxxxxx)')
    }

    const count = await this.agendaCalendarsRepository.countByUserId(
      input.userId,
    )
    if (count >= CALENDAR_LIMIT_PER_USER) {
      throw new AgendaCalendarLimitExceededError()
    }

    const createInput: CreateAgendaCalendarInput = {
      id: randomUUID(),
      userId: input.userId,
      name: input.name,
      color: input.color,
    }
    const calendar = await this.agendaCalendarsRepository.create(createInput)
    return { calendar }
  }
}
