import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { agendaCalendars } from './agenda-calendars'

export const agendaEventStatusEnum = pgEnum('agenda_event_status', [
  'scheduled',
  'done',
  'cancelled',
])

export const agendaEvents = pgTable('agenda_events', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  calendarId: text('calendar_id')
    .notNull()
    .references(() => agendaCalendars.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  allDay: boolean('all_day').notNull().default(false),
  recurrence: text('recurrence').notNull().default('none'),
  recurrenceInterval: integer('recurrence_interval').notNull().default(1),
  recurrenceCount: integer('recurrence_count'),
  recurrenceEndsAt: timestamp('recurrence_ends_at'),
  status: agendaEventStatusEnum('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
