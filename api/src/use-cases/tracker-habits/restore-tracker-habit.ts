import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
} from '@repositories/tracker-habits-repository'

interface RestoreTrackerHabitInput {
  habitId: string
  userId: string
}

interface RestoreTrackerHabitOutput {
  habit: TrackerHabitRecord
}

export class RestoreTrackerHabitUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    habitId,
    userId,
  }: RestoreTrackerHabitInput): Promise<RestoreTrackerHabitOutput> {
    const existing = await this.trackerHabitsRepository.findById(habitId, userId)
    if (!existing) throw new ResourceNotFoundError()
    const habit = await this.trackerHabitsRepository.setArchived(
      habitId,
      userId,
      { archived: false },
    )
    return { habit }
  }
}
