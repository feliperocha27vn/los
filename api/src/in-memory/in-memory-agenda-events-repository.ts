import type {
  AgendaEventRecord,
  AgendaEventRecurrence,
  AgendaEventsRepository,
  AgendaEventStatus,
  CreateAgendaEventInput,
  UpdateAgendaEventInput,
} from '@repositories/agenda-events-repository'

export class InMemoryAgendaEventsRepository implements AgendaEventsRepository {
  private events: AgendaEventRecord[] = []

  async findById(
    id: string,
    userId: string,
  ): Promise<AgendaEventRecord | null> {
    return this.events.find((e) => e.id === id && e.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: Date; to?: Date; calendarIds?: string[] },
  ): Promise<AgendaEventRecord[]> {
    let result = this.events.filter((e) => e.userId === userId)
    if (filters?.from) result = result.filter((e) => e.endAt >= filters.from!)
    if (filters?.to) result = result.filter((e) => e.startAt <= filters.to!)
    if (filters?.calendarIds && filters.calendarIds.length > 0) {
      result = result.filter((e) => filters.calendarIds!.includes(e.calendarId))
    }
    return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  }

  async countByUserId(userId: string): Promise<number> {
    return this.events.filter((e) => e.userId === userId).length
  }

  async create(input: CreateAgendaEventInput): Promise<AgendaEventRecord> {
    const now = new Date()
    const record: AgendaEventRecord = {
      id: input.id,
      userId: input.userId,
      calendarId: input.calendarId,
      title: input.title,
      description: input.description,
      location: input.location,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      recurrence: input.recurrence as AgendaEventRecurrence,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceCount: input.recurrenceCount,
      recurrenceEndsAt: input.recurrenceEndsAt,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }
    this.events.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEventRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('AgendaEvent not found')
    if (input.title !== undefined) record.title = input.title
    if (input.description !== undefined) record.description = input.description
    if (input.location !== undefined) record.location = input.location
    if (input.calendarId !== undefined) record.calendarId = input.calendarId
    if (input.startAt !== undefined) record.startAt = input.startAt
    if (input.endAt !== undefined) record.endAt = input.endAt
    if (input.allDay !== undefined) record.allDay = input.allDay
    if (input.recurrence !== undefined) {
      record.recurrence = input.recurrence as AgendaEventRecurrence
    }
    if (input.recurrenceInterval !== undefined) {
      record.recurrenceInterval = input.recurrenceInterval
    }
    if (input.recurrenceCount !== undefined) {
      record.recurrenceCount = input.recurrenceCount
    }
    if (input.recurrenceEndsAt !== undefined) {
      record.recurrenceEndsAt = input.recurrenceEndsAt
    }
    record.updatedAt = new Date()
    return record
  }

  async updateStatus(
    id: string,
    userId: string,
    status: AgendaEventStatus,
  ): Promise<AgendaEventRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('AgendaEvent not found')
    record.status = status
    record.updatedAt = new Date()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.events.findIndex(
      (e) => e.id === id && e.userId === userId,
    )
    if (index === -1) throw new Error('AgendaEvent not found')
    this.events.splice(index, 1)
  }
}
