import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
} from '@repositories/tracker-habits-repository'

interface FetchTrackerHabitsInput {
  userId: string
  includeArchived?: boolean
}

interface FetchTrackerHabitsOutput {
  habits: TrackerHabitRecord[]
}

export class FetchTrackerHabitsUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    userId,
    includeArchived,
  }: FetchTrackerHabitsInput): Promise<FetchTrackerHabitsOutput> {
    const records = await this.trackerHabitsRepository.findManyByUserId(
      userId,
      { includeArchived },
    )
    return { habits: records }
  }
}
