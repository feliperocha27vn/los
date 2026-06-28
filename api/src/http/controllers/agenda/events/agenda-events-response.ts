import z from 'zod'

export const agendaEventStatusSchema = z.enum(['scheduled', 'done', 'cancelled'])
export const agendaEventRecurrenceSchema = z.enum([
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
])

export const agendaEventResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  calendarId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  allDay: z.boolean(),
  recurrence: agendaEventRecurrenceSchema,
  recurrenceInterval: z.number(),
  recurrenceCount: z.number().nullable(),
  recurrenceEndsAt: z.string().nullable(),
  status: agendaEventStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const agendaEventExpandedResponseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  calendarId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  allDay: z.boolean(),
  recurrence: agendaEventRecurrenceSchema,
  isRecurring: z.boolean(),
  status: agendaEventStatusSchema,
  isException: z.boolean(),
})

export const agendaEventExceptionResponseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  originalDate: z.string(),
  action: z.enum(['cancel', 'reschedule']),
  newStartsAt: z.string().nullable(),
  newEndsAt: z.string().nullable(),
  createdAt: z.string(),
})

export function toEventResponse(record: {
  id: string
  title: string
  description: string | null
  location: string | null
  calendarId: string
  startAt: Date
  endAt: Date
  allDay: boolean
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrenceInterval: number
  recurrenceCount: number | null
  recurrenceEndsAt: Date | null
  status: 'scheduled' | 'done' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    location: record.location,
    calendarId: record.calendarId,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt.toISOString(),
    allDay: record.allDay,
    recurrence: record.recurrence,
    recurrenceInterval: record.recurrenceInterval,
    recurrenceCount: record.recurrenceCount,
    recurrenceEndsAt: record.recurrenceEndsAt
      ? record.recurrenceEndsAt.toISOString()
      : null,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function toExpandedEventResponse(record: {
  id: string
  eventId: string
  title: string
  description: string | null
  location: string | null
  calendarId: string
  startAt: Date
  endAt: Date
  allDay: boolean
  recurrence: string
  isRecurring: boolean
  status: 'scheduled' | 'done' | 'cancelled'
  isException: boolean
}) {
  return {
    id: record.id,
    eventId: record.eventId,
    title: record.title,
    description: record.description,
    location: record.location,
    calendarId: record.calendarId,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt.toISOString(),
    allDay: record.allDay,
    recurrence: record.recurrence,
    isRecurring: record.isRecurring,
    status: record.status,
    isException: record.isException,
  }
}

export function toExceptionResponse(record: {
  id: string
  eventId: string
  originalDate: string
  action: 'cancel' | 'reschedule'
  newStartsAt: Date | null
  newEndsAt: Date | null
  createdAt: Date
}) {
  return {
    id: record.id,
    eventId: record.eventId,
    originalDate: record.originalDate,
    action: record.action,
    newStartsAt: record.newStartsAt ? record.newStartsAt.toISOString() : null,
    newEndsAt: record.newEndsAt ? record.newEndsAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  }
}
