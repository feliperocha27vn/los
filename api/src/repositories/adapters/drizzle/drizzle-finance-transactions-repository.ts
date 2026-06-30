import { and, asc, between, eq, gt, ilike, sql } from 'drizzle-orm'
import { financeInstallments, financeTransactions } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateFinanceTransactionInput,
  FinanceInstallmentInput,
  FinanceInstallmentRecord,
  FinanceTransactionsRepository,
  FinanceTransactionListRecord,
  FinanceTransactionRecord,
  FinanceTransactionType,
  UpdateFinanceTransactionInput,
} from '@repositories/finance-transactions-repository'

function toTxRecord(
  row: typeof financeTransactions.$inferSelect,
): FinanceTransactionRecord {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    type: row.type,
    description: row.description,
    totalAmount: row.totalAmount,
    installmentsCount: row.installmentsCount,
    source: row.source,
    isFixed: row.isFixed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toInstRecord(
  row: typeof financeInstallments.$inferSelect,
): FinanceInstallmentRecord {
  return {
    id: row.id,
    transactionId: row.transactionId,
    installmentNumber: row.installmentNumber,
    amount: row.amount,
    date: row.date,
  }
}

class DrizzleFinanceTransactionsRepository
  implements FinanceTransactionsRepository
{
  async findById(
    id: string,
    userId: string,
  ): Promise<FinanceTransactionRecord | null> {
    const rows = await db
      .select()
      .from(financeTransactions)
      .where(
        and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)),
      )
      .limit(1)
    return rows[0] ? toTxRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: {
      type?: FinanceTransactionType
      categoryId?: string
      from?: string
      to?: string
      search?: string
    },
  ): Promise<FinanceTransactionListRecord[]> {
    const conditions = [eq(financeTransactions.userId, userId)]
    if (filters?.type) conditions.push(eq(financeTransactions.type, filters.type))
    if (filters?.categoryId)
      conditions.push(eq(financeTransactions.categoryId, filters.categoryId))
    if (filters?.search) {
      conditions.push(ilike(financeTransactions.description, `%${filters.search}%`))
    }

    // Quando o período é informado, listamos por parcela (uma linha por parcela que cai no
    // período), igual o resumo mensal já faz em sumInstallmentsInRange — é o que faz o valor
    // e a data exibidos baterem com o mês selecionado, em vez do valor total/data de criação.
    if (filters?.from && filters?.to) {
      const rows = await db
        .select({ transaction: financeTransactions, installment: financeInstallments })
        .from(financeInstallments)
        .innerJoin(financeTransactions, eq(financeInstallments.transactionId, financeTransactions.id))
        .where(and(...conditions, between(financeInstallments.date, filters.from, filters.to)))
        .orderBy(asc(financeInstallments.date))

      return rows.map(({ transaction, installment }) => ({
        ...toTxRecord(transaction),
        installmentAmount: installment.amount,
        installmentDate: installment.date,
        installmentNumber: installment.installmentNumber,
      }))
    }

    const rows = await db
      .select()
      .from(financeTransactions)
      .where(and(...conditions))
      .orderBy(asc(financeTransactions.createdAt))

    return rows.map((row) => ({
      ...toTxRecord(row),
      installmentAmount: null,
      installmentDate: null,
      installmentNumber: null,
    }))
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: financeTransactions.id })
      .from(financeTransactions)
      .where(eq(financeTransactions.userId, userId))
    return rows.length
  }

  async create(
    input: CreateFinanceTransactionInput,
  ): Promise<FinanceTransactionRecord> {
    const [row] = await db.insert(financeTransactions).values(input).returning()
    return toTxRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateFinanceTransactionInput,
  ): Promise<FinanceTransactionRecord> {
    const [row] = await db
      .update(financeTransactions)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)),
      )
      .returning()
    if (!row) throw new Error('FinanceTransaction not found')
    return toTxRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(financeTransactions)
      .where(
        and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)),
      )
    if (result.count === 0) throw new Error('FinanceTransaction not found')
  }

  async findInstallmentsByTransactionId(
    transactionId: string,
  ): Promise<FinanceInstallmentRecord[]> {
    const rows = await db
      .select()
      .from(financeInstallments)
      .where(eq(financeInstallments.transactionId, transactionId))
      .orderBy(asc(financeInstallments.installmentNumber))
    return rows.map(toInstRecord)
  }

  async createInstallments(
    inputs: FinanceInstallmentInput[],
  ): Promise<FinanceInstallmentRecord[]> {
    if (inputs.length === 0) return []
    const rows = await db
      .insert(financeInstallments)
      .values(inputs)
      .returning()
    return rows.map(toInstRecord)
  }

  async sumInstallmentsInRange(
    userId: string,
    type: FinanceTransactionType,
    from: string,
    to: string,
  ): Promise<number> {
    const result = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financeInstallments.amount}::numeric), 0)`,
      })
      .from(financeInstallments)
      .innerJoin(
        financeTransactions,
        eq(financeInstallments.transactionId, financeTransactions.id),
      )
      .where(
        and(
          eq(financeTransactions.userId, userId),
          eq(financeTransactions.type, type),
          between(financeInstallments.date, from, to),
        ),
      )
    return Number(result[0]?.total ?? 0)
  }

  async deleteFutureInstallments(transactionId: string, afterDate: string): Promise<void> {
    await db
      .delete(financeInstallments)
      .where(
        and(
          eq(financeInstallments.transactionId, transactionId),
          gt(financeInstallments.date, afterDate),
        ),
      )
  }
}

export const financeTransactionsRepository = new DrizzleFinanceTransactionsRepository()
