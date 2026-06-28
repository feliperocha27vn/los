import type {
  FinanceCategoriesRepository,
  FinanceCategoryRecord,
  FinanceCategoryType,
} from '@repositories/finance-categories-repository'

export class InMemoryFinanceCategoriesRepository implements FinanceCategoriesRepository {
  private categories: FinanceCategoryRecord[] = []

  async findById(id: string): Promise<FinanceCategoryRecord | null> {
    return this.categories.find((c) => c.id === id) ?? null
  }

  async findMany(filters?: { type?: FinanceCategoryType }): Promise<FinanceCategoryRecord[]> {
    let result = [...this.categories]
    if (filters?.type) {
      result = result.filter((c) => c.type === filters.type)
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }

  async createMany(records: FinanceCategoryRecord[]): Promise<void> {
    this.categories.push(...records)
  }

  async count(): Promise<number> {
    return this.categories.length
  }
}
