import { asc, eq } from 'drizzle-orm'
import { financeCategories } from '@db/schema'
import { db } from '@lib/db'
import type {
  FinanceCategoriesRepository,
  FinanceCategoryRecord,
  FinanceCategoryType,
} from '@repositories/finance-categories-repository'

function toRecord(
  row: typeof financeCategories.$inferSelect,
): FinanceCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
  }
}

class DrizzleFinanceCategoriesRepository implements FinanceCategoriesRepository {
  async findById(id: string): Promise<FinanceCategoryRecord | null> {
    const rows = await db
      .select()
      .from(financeCategories)
      .where(eq(financeCategories.id, id))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findMany(
    filters?: { type?: FinanceCategoryType },
  ): Promise<FinanceCategoryRecord[]> {
    const where = filters?.type ? eq(financeCategories.type, filters.type) : undefined
    const rows = await db
      .select()
      .from(financeCategories)
      .where(where)
      .orderBy(asc(financeCategories.name))
    return rows.map(toRecord)
  }

  async createMany(records: FinanceCategoryRecord[]): Promise<void> {
    if (records.length === 0) return
    await db.insert(financeCategories).values(records)
  }

  async count(): Promise<number> {
    const rows = await db.select({ id: financeCategories.id }).from(financeCategories)
    return rows.length
  }
}

export const financeCategoriesRepository = new DrizzleFinanceCategoriesRepository()
