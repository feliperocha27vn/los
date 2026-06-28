import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  pinHash: text('pin_hash').notNull().default(''),
  pinAttempts: integer('pin_attempts').notNull().default(0),
  pinLockedUntil: timestamp('pin_locked_until'),
  notificationOffsetMinutes: integer('notification_offset_minutes')
    .notNull()
    .default(15),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

