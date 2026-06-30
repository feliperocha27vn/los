import { boolean, date, integer, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { financeCategories } from './finance-categories'
import { users } from './users'

export const financeTransactionTypeEnum = pgEnum('finance_transaction_type', ['expense', 'income'])

export const financeTransactionSourceEnum = pgEnum('finance_transaction_source', [
  'principal',
  'credit_card',
])

export const financeTransactions = pgTable('finance_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  categoryId: text('category_id').references(() => financeCategories.id),
  type: financeTransactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 20, scale: 10 }).notNull(),
  installmentsCount: integer('installments_count').notNull().default(1),
  source: financeTransactionSourceEnum('source').notNull().default('principal'),
  isFixed: boolean('is_fixed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
