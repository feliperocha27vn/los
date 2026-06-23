import type {
  CofreCategory,
  CofreEntryRecord,
  CofreEntriesRepository,
  CreateCofreEntryInput,
  UpdateCofreEntryInput,
} from '@repositories/cofre-entries-repository'

export class InMemoryCofreEntriesRepository implements CofreEntriesRepository {
  private entries: CofreEntryRecord[] = []

  async findById(id: string, userId: string): Promise<CofreEntryRecord | null> {
    return (
      this.entries.find((e) => e.id === id && e.userId === userId) ?? null
    )
  }

  async findManyByUserId(
    userId: string,
    filters?: { category?: CofreCategory; search?: string }
  ): Promise<CofreEntryRecord[]> {
    let result = this.entries.filter((e) => e.userId === userId)

    if (filters?.category) {
      result = result.filter((e) => e.category === filters.category)
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          (e.username?.toLowerCase().includes(term) ?? false) ||
          (e.url?.toLowerCase().includes(term) ?? false) ||
          (e.provider?.toLowerCase().includes(term) ?? false)
      )
    }

    return result
  }

  async create(input: CreateCofreEntryInput): Promise<CofreEntryRecord> {
    const entry: CofreEntryRecord = {
      id: input.id,
      userId: input.userId,
      category: input.category,
      title: input.title,
      url: input.url ?? null,
      username: input.username ?? null,
      passwordEnc: input.passwordEnc ?? null,
      contentEnc: input.contentEnc ?? null,
      provider: input.provider ?? null,
      tokenEnc: input.tokenEnc ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.entries.push(entry)

    return entry
  }

  async update(
    id: string,
    userId: string,
    input: UpdateCofreEntryInput
  ): Promise<CofreEntryRecord> {
    const entry = this.entries.find((e) => e.id === id && e.userId === userId)

    if (!entry) {
      throw new Error('Entry not found')
    }

    Object.assign(entry, input, { updatedAt: new Date() })

    return entry
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.entries.findIndex(
      (e) => e.id === id && e.userId === userId
    )

    if (index === -1) {
      throw new Error('Entry not found')
    }

    this.entries.splice(index, 1)
  }
}
