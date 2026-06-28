export type AgendaEventRecurrence =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
export type AgendaEventStatus = 'scheduled' | 'done' | 'cancelled'

export interface AgendaEventRecord {
  id: string
  userId: string
  calendarId: string
  title: string
  description: string | null
  location: string | null
  startAt: Date
  endAt: Date
  allDay: boolean
  recurrence: AgendaEventRecurrence
  recurrenceInterval: number
  recurrenceCount: number | null
  recurrenceEndsAt: Date | null
  status: AgendaEventStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateAgendaEventInput = Pick<
  AgendaEventRecord,
  | 'id'
  | 'userId'
  | 'calendarId'
  | 'title'
  | 'startAt'
  | 'endAt'
  | 'allDay'
  | 'recurrence'
  | 'recurrenceInterval'
> & {
  description: string | null
  location: string | null
  recurrenceCount: number | null
  recurrenceEndsAt: Date | null
}

export type UpdateAgendaEventInput = Partial<
  Pick<
    AgendaEventRecord,
    | 'title'
    | 'description'
    | 'location'
    | 'calendarId'
    | 'startAt'
    | 'endAt'
    | 'allDay'
    | 'recurrence'
    | 'recurrenceInterval'
    | 'recurrenceCount'
    | 'recurrenceEndsAt'
  >
>

export interface AgendaEventsRepository {
  findById(id: string, userId: string): Promise<AgendaEventRecord | null>
  findManyByUserId(
    userId: string,
    filters?: {
      from?: Date
      to?: Date
      calendarIds?: string[]
    },
  ): Promise<AgendaEventRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateAgendaEventInput): Promise<AgendaEventRecord>
  update(
    id: string,
    userId: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEventRecord>
  updateStatus(
    id: string,
    userId: string,
    status: AgendaEventStatus,
  ): Promise<AgendaEventRecord>
  delete(id: string, userId: string): Promise<void>
}
