import { randomUUID } from 'node:crypto'
import type {
  CofreCategory,
  CofreEntriesRepository,
  CofreEntryRecord,
} from '@repositories/cofre-entries-repository'

interface CreateCofreEntryInput {
  userId: string
  category: CofreCategory
  title: string
  url?: string | null
  username?: string | null
  passwordEnc?: string | null
  contentEnc?: string | null
  provider?: string | null
  tokenEnc?: string | null
}

interface CreateCofreEntryOutput {
  entry: CofreEntryRecord
}

export class CreateCofreEntryUseCase {
  constructor(private readonly entriesRepository: CofreEntriesRepository) {}

  async execute(input: CreateCofreEntryInput): Promise<CreateCofreEntryOutput> {
    const entry = await this.entriesRepository.create({
      id: randomUUID(),
      userId: input.userId,
      category: input.category,
      title: input.title,
      url: input.url,
      username: input.username,
      passwordEnc: input.passwordEnc,
      contentEnc: input.contentEnc,
      provider: input.provider,
      tokenEnc: input.tokenEnc,
    })

    return { entry }
  }
}
