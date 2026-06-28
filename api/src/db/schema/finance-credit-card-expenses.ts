import { boolean, date, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { financeCategories } from './finance-categories'
import { financeTransactions } from './finance-transactions'
import { users } from './users'

export const financeCreditCardExpenses = pgTable('finance_credit_card_expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  categoryId: text('category_id').references(() => financeCategories.id),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 20, scale: 10 }).notNull(),
  myShareAmount: numeric('my_share_amount', {
    precision: 20,
    scale: 10,
  }).notNull(),
  date: date('date').notNull(),
  launchedInMain: boolean('launched_in_main').notNull().default(false),
  linkedTransactionId: text('linked_transaction_id').references(() => financeTransactions.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
