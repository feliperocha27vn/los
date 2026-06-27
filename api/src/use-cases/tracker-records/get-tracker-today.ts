import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type {
  TrackerRecordRecord,
  TrackerRecordsRepository,
} from '@repositories/tracker-records-repository'

interface TrackerDayItem {
  habitId: string
  name: string
  icon: string
  completed: boolean
  recordId: string | null
}

interface GetTrackerTodayOutput {
  date: string
  habits: TrackerDayItem[]
  energy: TrackerRecordRecord['energy']
  quality: TrackerRecordRecord['quality']
  score: { completed: number; total: number }
}

function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export class GetTrackerTodayUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
    private readonly trackerRecordsRepository: TrackerRecordsRepository,
  ) {}

  async execute({ userId }: { userId: string }): Promise<GetTrackerTodayOutput> {
    const date = todayUtcIso()
    return this.executeForDate({ userId, date })
  }

  async executeForDate({
    userId,
    date,
  }: {
    userId: string
    date: string
  }): Promise<GetTrackerTodayOutput> {
    const habits = await this.trackerHabitsRepository.findManyByUserId(userId)
    const records =
      await this.trackerRecordsRepository.findManyByUserIdAndDate(userId, date)

    const recordsByHabit = new Map(records.map((r) => [r.habitId, r]))

    const items: TrackerDayItem[] = habits.map((h) => {
      const r = recordsByHabit.get(h.id)
      return {
        habitId: h.id,
        name: h.name,
        icon: h.icon,
        completed: r ? r.completed : false,
        recordId: r ? r.id : null,
      }
    })

    const completed = items.filter((i) => i.completed).length
    const total = items.length

    const dayRecords = records
    const energy =
      dayRecords.find((r) => r.energy !== null)?.energy ?? null
    const quality =
      dayRecords.find((r) => r.quality !== null)?.quality ?? null

    return {
      date,
      habits: items,
      energy,
      quality,
      score: { completed, total },
    }
  }
}
