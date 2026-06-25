import { numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { studyModules } from './study-modules'

export const studyPages = pgTable('study_pages', {
  id: text('id').primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => studyModules.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  position: numeric('position', { precision: 20, scale: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
