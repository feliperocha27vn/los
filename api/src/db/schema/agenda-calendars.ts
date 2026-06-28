import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const agendaCalendars = pgTable('agenda_calendars', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
