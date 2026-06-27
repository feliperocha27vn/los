import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'

interface ArchiveTrackerHabitInput {
  habitId: string
  userId: string
}

export class ArchiveTrackerHabitUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    habitId,
    userId,
  }: ArchiveTrackerHabitInput): Promise<void> {
    try {
      await this.trackerHabitsRepository.setArchived(habitId, userId, {
        archived: true,
      })
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
