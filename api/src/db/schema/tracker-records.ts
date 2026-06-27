import { boolean, date, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'
import { trackerHabits } from './tracker-habits'

export const trackerRecords = pgTable(
  'tracker_records',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => trackerHabits.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    date: date('date').notNull(),
    completed: boolean('completed').notNull().default(false),
    energy: text('energy'),
    quality: text('quality'),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    habitDateUnique: uniqueIndex('tracker_records_habit_id_date_idx').on(
      table.habitId,
      table.date,
    ),
  }),
)
