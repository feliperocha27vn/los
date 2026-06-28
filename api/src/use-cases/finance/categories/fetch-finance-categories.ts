import type {
  FinanceCategoriesRepository,
  FinanceCategoryRecord,
} from '@repositories/finance-categories-repository'

interface FetchFinanceCategoriesInput {
  type?: 'expense' | 'income'
}

interface FetchFinanceCategoriesOutput {
  categories: FinanceCategoryRecord[]
}

export class FetchFinanceCategoriesUseCase {
  constructor(private readonly financeCategoriesRepository: FinanceCategoriesRepository) {}

  async execute({ type }: FetchFinanceCategoriesInput): Promise<FetchFinanceCategoriesOutput> {
    const categories = await this.financeCategoriesRepository.findMany({ type })
    return { categories }
  }
}
