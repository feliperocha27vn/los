import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

export const financeCategoryTypeEnum = pgEnum('finance_category_type', ['expense', 'income'])

export const financeCategories = pgTable('finance_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: financeCategoryTypeEnum('type').notNull(),
  color: text('color').notNull(),
})
