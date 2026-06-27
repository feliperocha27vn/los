import { boolean, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const trackerHabits = pgTable('tracker_habits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  position: numeric('position', { precision: 20, scale: 10 }).notNull(),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
