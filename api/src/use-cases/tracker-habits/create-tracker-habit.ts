import { randomUUID } from 'node:crypto'
import type {
  TrackerHabitRecord,
  TrackerHabitsRepository,
} from '@repositories/tracker-habits-repository'

const TRACKER_HABIT_LIMIT = 20
const POSITION_STEP = 1.0

interface CreateTrackerHabitInput {
  userId: string
  name: string
  icon: string
}

interface CreateTrackerHabitOutput {
  habit: TrackerHabitRecord
}

export class CreateTrackerHabitUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    userId,
    name,
    icon,
  }: CreateTrackerHabitInput): Promise<CreateTrackerHabitOutput> {
    const count = await this.trackerHabitsRepository.countByUserId(userId)
    if (count >= TRACKER_HABIT_LIMIT) {
      throw new Error('Limite de hábitos atingido (20)')
    }

    const userHabits = await this.trackerHabitsRepository.findManyByUserId(
      userId,
      { includeArchived: true },
    )
    const maxPosition = userHabits.reduce((max, h) => {
      const n = Number(h.position)
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const nextPosition = (maxPosition + POSITION_STEP).toFixed(10)

    const habit = await this.trackerHabitsRepository.create({
      id: randomUUID(),
      userId,
      name,
      icon,
      position: nextPosition,
    })

    return { habit }
  }
}
