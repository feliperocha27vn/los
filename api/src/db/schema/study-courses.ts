import { numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const studyCourses = pgTable('study_courses', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  position: numeric('position', { precision: 20, scale: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
