export interface AgendaCalendarRecord {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export type CreateAgendaCalendarInput = Pick<
  AgendaCalendarRecord,
  'id' | 'userId' | 'name' | 'color'
>

export type UpdateAgendaCalendarInput = Partial<
  Pick<AgendaCalendarRecord, 'name' | 'color'>
>

export interface AgendaCalendarsRepository {
  findById(id: string, userId: string): Promise<AgendaCalendarRecord | null>
  findManyByUserId(userId: string): Promise<AgendaCalendarRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateAgendaCalendarInput): Promise<AgendaCalendarRecord>
  update(
    id: string,
    userId: string,
    input: UpdateAgendaCalendarInput,
  ): Promise<AgendaCalendarRecord>
  delete(id: string, userId: string): Promise<void>
}
