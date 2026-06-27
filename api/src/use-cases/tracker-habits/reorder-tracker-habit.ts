import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
} from '@repositories/tracker-habits-repository'

interface ReorderTrackerHabitInput {
  habitId: string
  userId: string
  position: number
}

interface ReorderTrackerHabitOutput {
  habit: TrackerHabitRecord
}

export class ReorderTrackerHabitUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    habitId,
    userId,
    position,
  }: ReorderTrackerHabitInput): Promise<ReorderTrackerHabitOutput> {
    const existing = await this.trackerHabitsRepository.findById(habitId, userId)
    if (!existing) throw new ResourceNotFoundError()
    const habit = await this.trackerHabitsRepository.reorder(habitId, userId, {
      position: position.toFixed(10),
    })
    return { habit }
  }
}
