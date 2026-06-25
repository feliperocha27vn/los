import { numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { studyCourses } from './study-courses'

export const studyModules = pgTable('study_modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => studyCourses.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  position: numeric('position', { precision: 20, scale: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
