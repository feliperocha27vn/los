export type FinanceCategoryType = 'expense' | 'income'

export interface FinanceCategoryRecord {
  id: string
  name: string
  type: FinanceCategoryType
  color: string
}

export interface FinanceCategoriesRepository {
  findById(id: string): Promise<FinanceCategoryRecord | null>
  findMany(filters?: { type?: FinanceCategoryType }): Promise<FinanceCategoryRecord[]>
  createMany(records: FinanceCategoryRecord[]): Promise<void>
  count(): Promise<number>
}
