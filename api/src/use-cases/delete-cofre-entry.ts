import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'

interface DeleteCofreEntryInput {
  entryId: string
  userId: string
}

export class DeleteCofreEntryUseCase {
  constructor(private readonly entriesRepository: CofreEntriesRepository) {}

  async execute({ entryId, userId }: DeleteCofreEntryInput): Promise<void> {
    try {
      await this.entriesRepository.delete(entryId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
