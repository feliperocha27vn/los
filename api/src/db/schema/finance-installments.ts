import { date, integer, numeric, pgTable, text } from 'drizzle-orm/pg-core'
import { financeTransactions } from './finance-transactions'

export const financeInstallments = pgTable('finance_installments', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => financeTransactions.id, { onDelete: 'cascade' }),
  installmentNumber: integer('installment_number').notNull(),
  amount: numeric('amount', { precision: 20, scale: 10 }).notNull(),
  date: date('date').notNull(),
})
