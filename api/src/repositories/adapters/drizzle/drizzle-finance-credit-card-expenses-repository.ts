import { and, asc, between, eq } from 'drizzle-orm'
import { financeCreditCardExpenses } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateFinanceCreditCardExpenseInput,
  FinanceCreditCardExpenseRecord,
  FinanceCreditCardExpensesRepository,
  UpdateFinanceCreditCardExpenseInput,
} from '@repositories/finance-credit-card-expenses-repository'

function toRecord(
  row: typeof financeCreditCardExpenses.$inferSelect,
): FinanceCreditCardExpenseRecord {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    description: row.description,
    totalAmount: row.totalAmount,
    myShareAmount: row.myShareAmount,
    date: row.date,
    launchedInMain: row.launchedInMain,
    linkedTransactionId: row.linkedTransactionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleFinanceCreditCardExpensesRepository
  implements FinanceCreditCardExpensesRepository
{
  async findById(
    id: string,
    userId: string,
  ): Promise<FinanceCreditCardExpenseRecord | null> {
    const rows = await db
      .select()
      .from(financeCreditCardExpenses)
      .where(
        and(
          eq(financeCreditCardExpenses.id, id),
          eq(financeCreditCardExpenses.userId, userId),
        ),
      )
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string },
  ): Promise<FinanceCreditCardExpenseRecord[]> {
    const conditions = [eq(financeCreditCardExpenses.userId, userId)]
    if (filters?.from && filters?.to) {
      conditions.push(between(financeCreditCardExpenses.date, filters.from, filters.to))
    }
    const rows = await db
      .select()
      .from(financeCreditCardExpenses)
      .where(and(...conditions))
      .orderBy(asc(financeCreditCardExpenses.date))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: financeCreditCardExpenses.id })
      .from(financeCreditCardExpenses)
      .where(eq(financeCreditCardExpenses.userId, userId))
    return rows.length
  }

  async create(
    input: CreateFinanceCreditCardExpenseInput,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const [row] = await db
      .insert(financeCreditCardExpenses)
      .values(input)
      .returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateFinanceCreditCardExpenseInput,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const [row] = await db
      .update(financeCreditCardExpenses)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(financeCreditCardExpenses.id, id),
          eq(financeCreditCardExpenses.userId, userId),
        ),
      )
      .returning()
    if (!row) throw new Error('FinanceCreditCardExpense not found')
    return toRecord(row)
  }

  async markLaunched(
    id: string,
    userId: string,
    linkedTransactionId: string,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const [row] = await db
      .update(financeCreditCardExpenses)
      .set({
        launchedInMain: true,
        linkedTransactionId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(financeCreditCardExpenses.id, id),
          eq(financeCreditCardExpenses.userId, userId),
        ),
      )
      .returning()
    if (!row) throw new Error('FinanceCreditCardExpense not found')
    return toRecord(row)
  }

  async markUnlaunched(
    id: string,
    userId: string,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const [row] = await db
      .update(financeCreditCardExpenses)
      .set({
        launchedInMain: false,
        linkedTransactionId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(financeCreditCardExpenses.id, id),
          eq(financeCreditCardExpenses.userId, userId),
        ),
      )
      .returning()
    if (!row) throw new Error('FinanceCreditCardExpense not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(financeCreditCardExpenses)
      .where(
        and(
          eq(financeCreditCardExpenses.id, id),
          eq(financeCreditCardExpenses.userId, userId),
        ),
      )
    if (result.count === 0) throw new Error('FinanceCreditCardExpense not found')
  }
}

export const financeCreditCardExpensesRepository =
  new DrizzleFinanceCreditCardExpensesRepository()
