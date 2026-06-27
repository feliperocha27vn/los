import type {
  CreateTrackerRecordInput,
  TrackerRecordRecord,
  TrackerRecordsRepository,
  UpdateTrackerRecordInput,
} from '@repositories/tracker-records-repository'

export class InMemoryTrackerRecordsRepository implements TrackerRecordsRepository {
  private records: TrackerRecordRecord[] = []

  async findById(id: string, userId: string): Promise<TrackerRecordRecord | null> {
    return this.records.find((r) => r.id === id && r.userId === userId) ?? null
  }

  async findByHabitAndDate(
    habitId: string,
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord | null> {
    return (
      this.records.find(
        (r) => r.habitId === habitId && r.userId === userId && r.date === date,
      ) ?? null
    )
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string; habitId?: string },
  ): Promise<TrackerRecordRecord[]> {
    let result = this.records.filter((r) => r.userId === userId)
    if (filters?.from) {
      result = result.filter((r) => r.date >= filters.from!)
    }
    if (filters?.to) {
      result = result.filter((r) => r.date <= filters.to!)
    }
    if (filters?.habitId) {
      result = result.filter((r) => r.habitId === filters.habitId)
    }
    return result.sort((a, b) => a.date.localeCompare(b.date))
  }

  async findManyByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord[]> {
    return this.records.filter((r) => r.userId === userId && r.date === date)
  }

  async countByUserId(userId: string): Promise<number> {
    return this.records.filter((r) => r.userId === userId).length
  }

  async create(input: CreateTrackerRecordInput): Promise<TrackerRecordRecord> {
    const record: TrackerRecordRecord = {
      id: input.id,
      habitId: input.habitId,
      userId: input.userId,
      date: input.date,
      completed: input.completed,
      energy: input.energy,
      quality: input.quality,
      note: input.note,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.records.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateTrackerRecordInput,
  ): Promise<TrackerRecordRecord> {
    const record = this.records.find((r) => r.id === id && r.userId === userId)
    if (!record) throw new Error('TrackerRecord not found')
    if (input.completed !== undefined) record.completed = input.completed
    if (input.energy !== undefined) record.energy = input.energy
    if (input.quality !== undefined) record.quality = input.quality
    if (input.note !== undefined) record.note = input.note
    record.updatedAt = new Date()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.records.findIndex(
      (r) => r.id === id && r.userId === userId,
    )
    if (index === -1) throw new Error('TrackerRecord not found')
    this.records.splice(index, 1)
  }
}
