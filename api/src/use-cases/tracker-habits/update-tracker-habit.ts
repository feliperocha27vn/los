import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
  UpdateTrackerHabitInput,
} from '@repositories/tracker-habits-repository'

interface UpdateTrackerHabitPayload {
  habitId: string
  userId: string
  name?: string
  icon?: string
}

interface UpdateTrackerHabitOutput {
  habit: TrackerHabitRecord
}

export class UpdateTrackerHabitUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    habitId,
    userId,
    ...data
  }: UpdateTrackerHabitPayload): Promise<UpdateTrackerHabitOutput> {
    const input: UpdateTrackerHabitInput = {}
    if (data.name !== undefined) input.name = data.name
    if (data.icon !== undefined) input.icon = data.icon
    try {
      const habit = await this.trackerHabitsRepository.update(
        habitId,
        userId,
        input,
      )
      return { habit }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
