import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'

interface DeleteTrackerRecordInput {
  recordId: string
  userId: string
}

export class DeleteTrackerRecordUseCase {
  constructor(
    private readonly trackerRecordsRepository: TrackerRecordsRepository,
  ) {}

  async execute({
    recordId,
    userId,
  }: DeleteTrackerRecordInput): Promise<void> {
    try {
      await this.trackerRecordsRepository.delete(recordId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
