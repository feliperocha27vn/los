import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
} from '@repositories/tracker-habits-repository'

interface GetTrackerHabitDetailInput {
  habitId: string
  userId: string
}

interface GetTrackerHabitDetailOutput {
  habit: TrackerHabitRecord
}

export class GetTrackerHabitDetailUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    habitId,
    userId,
  }: GetTrackerHabitDetailInput): Promise<GetTrackerHabitDetailOutput> {
    const habit = await this.trackerHabitsRepository.findById(habitId, userId)
    if (!habit) throw new ResourceNotFoundError()
    return { habit }
  }
}
