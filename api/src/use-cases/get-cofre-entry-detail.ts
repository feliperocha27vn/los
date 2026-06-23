import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { CofreEntriesRepository, CofreEntryRecord } from '@repositories/cofre-entries-repository'

interface GetCofreEntryDetailInput {
  entryId: string
  userId: string
}

interface GetCofreEntryDetailOutput {
  entry: CofreEntryRecord
}

export class GetCofreEntryDetailUseCase {
  constructor(private readonly entriesRepository: CofreEntriesRepository) {}

  async execute({
    entryId,
    userId,
  }: GetCofreEntryDetailInput): Promise<GetCofreEntryDetailOutput> {
    const entry = await this.entriesRepository.findById(entryId, userId)

    if (!entry) {
      throw new ResourceNotFoundError()
    }

    return { entry }
  }
}
