import type { CofreCategory, CofreEntriesRepository } from '@repositories/cofre-entries-repository'

interface FetchCofreEntriesInput {
  userId: string
  category?: CofreCategory
  search?: string
}

interface CofreEntrySummary {
  id: string
  category: CofreCategory
  title: string
  url: string | null
  username: string | null
  provider: string | null
  createdAt: Date
  updatedAt: Date
}

interface FetchCofreEntriesOutput {
  entries: CofreEntrySummary[]
}

export class FetchCofreEntriesUseCase {
  constructor(private readonly entriesRepository: CofreEntriesRepository) {}

  async execute({
    userId,
    category,
    search,
  }: FetchCofreEntriesInput): Promise<FetchCofreEntriesOutput> {
    const records = await this.entriesRepository.findManyByUserId(userId, {
      category,
      search,
    })

    const entries = records.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      url: r.url,
      username: r.username,
      provider: r.provider,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    return { entries }
  }
}
