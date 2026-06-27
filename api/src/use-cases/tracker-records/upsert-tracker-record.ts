import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type {
  TrackerQuality,
  TrackerRecordRecord,
  TrackerRecordsRepository,
} from '@repositories/tracker-records-repository'

const TRACKER_RECORD_LIMIT = 10_000

interface UpsertTrackerRecordInput {
  userId: string
  habitId: string
  date: string
  completed: boolean
  energy?: TrackerRecordRecord['energy']
  quality?: TrackerRecordRecord['quality']
  note?: string | null
}

interface UpsertTrackerRecordOutput {
  record: TrackerRecordRecord
}

export class UpsertTrackerRecordUseCase {
  constructor(
    private readonly trackerRecordsRepository: TrackerRecordsRepository,
    private readonly trackerHabitsRepository: TrackerHabitsRepository,
  ) {}

  async execute({
    userId,
    habitId,
    date,
    completed,
    energy,
    quality,
    note,
  }: UpsertTrackerRecordInput): Promise<UpsertTrackerRecordOutput> {
    const habit = await this.trackerHabitsRepository.findById(habitId, userId)
    if (!habit) throw new ResourceNotFoundError()

    const existing = await this.trackerRecordsRepository.findByHabitAndDate(
      habitId,
      userId,
      date,
    )

    if (existing) {
      const updateInput: { completed?: boolean; energy?: TrackerRecordRecord['energy']; quality?: TrackerRecordRecord['quality']; note?: string | null } = {}
      updateInput.completed = completed
      if (energy !== undefined) updateInput.energy = energy
      if (quality !== undefined) updateInput.quality = quality
      if (note !== undefined) updateInput.note = note

      const record = await this.trackerRecordsRepository.update(
        existing.id,
        userId,
        updateInput,
      )
      return { record }
    }

    const count = await this.trackerRecordsRepository.countByUserId(userId)
    if (count >= TRACKER_RECORD_LIMIT) {
      throw new Error('Limite de registros atingido (10000)')
    }

    const record = await this.trackerRecordsRepository.create({
      id: randomUUID(),
      habitId,
      userId,
      date,
      completed,
      energy: energy ?? null,
      quality: (quality as TrackerQuality | null) ?? null,
      note: note ?? null,
    })
    return { record }
  }
}
