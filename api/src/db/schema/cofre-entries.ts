import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const cofreCategoryEnum = pgEnum('cofre_category', [
  'credential',
  'secure_note',
  'api_key',
])

export const cofreEntries = pgTable('cofre_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  category: cofreCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  url: text('url'),
  username: text('username'),
  passwordEnc: text('password_enc'),
  contentEnc: text('content_enc'),
  provider: text('provider'),
  tokenEnc: text('token_enc'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
