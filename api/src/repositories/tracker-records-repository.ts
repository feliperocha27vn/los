export type TrackerEnergy = 'low' | 'medium' | 'high'
export type TrackerQuality = 'weak' | 'ok' | 'strong'

export interface TrackerRecordRecord {
  id: string
  habitId: string
  userId: string
  date: string
  completed: boolean
  energy: TrackerEnergy | null
  quality: TrackerQuality | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateTrackerRecordInput = Omit<
  TrackerRecordRecord,
  'createdAt' | 'updatedAt'
>

export type UpdateTrackerRecordInput = Partial<
  Pick<TrackerRecordRecord, 'completed' | 'energy' | 'quality' | 'note'>
>

export interface TrackerRecordsRepository {
  findById(id: string, userId: string): Promise<TrackerRecordRecord | null>
  findByHabitAndDate(
    habitId: string,
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string; habitId?: string },
  ): Promise<TrackerRecordRecord[]>
  findManyByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<TrackerRecordRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateTrackerRecordInput): Promise<TrackerRecordRecord>
  update(
    id: string,
    userId: string,
    input: UpdateTrackerRecordInput,
  ): Promise<TrackerRecordRecord>
  delete(id: string, userId: string): Promise<void>
}
