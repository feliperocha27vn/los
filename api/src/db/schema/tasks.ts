import { numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const taskColumnEnum = pgEnum('task_column', ['todo', 'in_progress', 'done'])
export const taskCategoryEnum = pgEnum('task_category', ['work', 'personal', 'other'])

export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    category: taskCategoryEnum('category').notNull().default('other'),
    column: taskColumnEnum('column').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    position: numeric('position', { precision: 20, scale: 10 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userCategoryColumnPositionIdx: {
      columns: [table.userId, table.category, table.column, table.position],
    },
  }),
)
