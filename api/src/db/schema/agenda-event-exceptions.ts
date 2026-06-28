import {
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { agendaEvents } from './agenda-events'

export const agendaExceptionActionEnum = pgEnum('agenda_exception_action', [
  'cancel',
  'reschedule',
])

export const agendaEventExceptions = pgTable(
  'agenda_event_exceptions',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => agendaEvents.id, { onDelete: 'cascade' }),
    originalDate: date('original_date').notNull(),
    action: agendaExceptionActionEnum('action').notNull(),
    newStartsAt: timestamp('new_starts_at'),
    newEndsAt: timestamp('new_ends_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    eventDateUnique: uniqueIndex('agenda_event_exceptions_event_id_original_date_idx').on(
      table.eventId,
      table.originalDate,
    ),
  }),
)
