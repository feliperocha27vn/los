import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const agendaTelegramLinks = pgTable('agenda_telegram_links', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  chatId: bigint('chat_id', { mode: 'number' }).notNull(),
  linkedAt: timestamp('linked_at').notNull().defaultNow(),
})
