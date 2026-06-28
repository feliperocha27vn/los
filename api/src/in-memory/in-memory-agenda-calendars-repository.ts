import type {
  AgendaCalendarRecord,
  AgendaCalendarsRepository,
  CreateAgendaCalendarInput,
  UpdateAgendaCalendarInput,
} from '@repositories/agenda-calendars-repository'

export class InMemoryAgendaCalendarsRepository
  implements AgendaCalendarsRepository
{
  private calendars: AgendaCalendarRecord[] = []

  async findById(
    id: string,
    userId: string,
  ): Promise<AgendaCalendarRecord | null> {
    return (
      this.calendars.find((c) => c.id === id && c.userId === userId) ?? null
    )
  }

  async findManyByUserId(userId: string): Promise<AgendaCalendarRecord[]> {
    return this.calendars
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async countByUserId(userId: string): Promise<number> {
    return this.calendars.filter((c) => c.userId === userId).length
  }

  async create(
    input: CreateAgendaCalendarInput,
  ): Promise<AgendaCalendarRecord> {
    const now = new Date()
    const record: AgendaCalendarRecord = {
      id: input.id,
      userId: input.userId,
      name: input.name,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    }
    this.calendars.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateAgendaCalendarInput,
  ): Promise<AgendaCalendarRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('AgendaCalendar not found')
    if (input.name !== undefined) record.name = input.name
    if (input.color !== undefined) record.color = input.color
    record.updatedAt = new Date()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.calendars.findIndex(
      (c) => c.id === id && c.userId === userId,
    )
    if (index === -1) throw new Error('AgendaCalendar not found')
    this.calendars.splice(index, 1)
  }
}
