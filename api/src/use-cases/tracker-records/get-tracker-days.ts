import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type {
  TrackerRecordRecord,
  TrackerRecordsRepository,
} from '@repositories/tracker-records-repository'

const MAX_DAYS_RANGE = 90

interface TrackerDayHistoryItem {
  habitId: string
  name: string
  icon: string
  completed: boolean
  recordId: string
}

interface TrackerDayHistory {
  date: string
  habits: TrackerDayHistoryItem[]
  energy: TrackerRecordRecord['energy']
  quality: TrackerRecordRecord['quality']
  score: { completed: number; total: number }
}

interface GetTrackerDaysInput {
  userId: string
  from: string
  to: string
}

interface GetTrackerDaysOutput {
  days: TrackerDayHistory[]
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export class GetTrackerDaysUseCase {
  constructor(
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
    private readonly trackerRecordsRepository: TrackerRecordsRepository,
  ) {}

  async execute({
    userId,
    from,
    to,
  }: GetTrackerDaysInput): Promise<GetTrackerDaysOutput> {
    const todayIso = todayUtcIso()
    const defaultFrom = isoDateDaysAgo(30)

    const fromDate = from ?? defaultFrom
    const toDate = to ?? todayIso

    const fromD = new Date(fromDate)
    const toD = new Date(toDate)
    const daysDiff = Math.floor(
      (toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysDiff < 0) {
      throw new Error('Range inválido: from > to')
    }
    if (daysDiff > MAX_DAYS_RANGE) {
      throw new Error(`Range máximo de ${MAX_DAYS_RANGE} dias`)
    }

    const habits = await this.trackerHabitsRepository.findManyByUserId(
      userId,
      { includeArchived: true },
    )
    const records = await this.trackerRecordsRepository.findManyByUserId(
      userId,
      { from: fromDate, to: toDate },
    )

    const habitsById = new Map(habits.map((h) => [h.id, h]))

    const recordsByDate = new Map<string, TrackerRecordRecord[]>()
    for (const r of records) {
      if (!recordsByDate.has(r.date)) recordsByDate.set(r.date, [])
      recordsByDate.get(r.date)!.push(r)
    }

    const days: TrackerDayHistory[] = []
    const dates = Array.from(recordsByDate.keys()).sort()
    for (const date of dates) {
      const dayRecords = recordsByDate.get(date)!
      const items: TrackerDayHistoryItem[] = []
      for (const r of dayRecords) {
        const habit = habitsById.get(r.habitId)
        if (!habit) continue
        items.push({
          habitId: habit.id,
          name: habit.name,
          icon: habit.icon,
          completed: r.completed,
          recordId: r.id,
        })
      }
      const completed = items.filter((i) => i.completed).length
      const total = items.length
      const energy = dayRecords.find((r) => r.energy !== null)?.energy ?? null
      const quality = dayRecords.find((r) => r.quality !== null)?.quality ?? null
      days.push({
        date,
        habits: items,
        energy,
        quality,
        score: { completed, total },
      })
    }

    return { days }
  }
}
