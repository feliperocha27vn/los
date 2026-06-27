export interface TrackerHabitRecord {
  id: string
  userId: string
  name: string
  icon: string
  position: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateTrackerHabitInput = Pick<
  TrackerHabitRecord,
  'id' | 'userId' | 'name' | 'icon' | 'position'
>

export type UpdateTrackerHabitInput = Partial<Pick<TrackerHabitRecord, 'name' | 'icon'>>

export type ReorderTrackerHabitInput = Pick<TrackerHabitRecord, 'position'>

export type ArchiveTrackerHabitInput = Pick<TrackerHabitRecord, 'archived'>

export interface TrackerHabitsRepository {
  findById(id: string, userId: string): Promise<TrackerHabitRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { includeArchived?: boolean },
  ): Promise<TrackerHabitRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateTrackerHabitInput): Promise<TrackerHabitRecord>
  update(
    id: string,
    userId: string,
    input: UpdateTrackerHabitInput,
  ): Promise<TrackerHabitRecord>
  reorder(
    id: string,
    userId: string,
    input: ReorderTrackerHabitInput,
  ): Promise<TrackerHabitRecord>
  setArchived(
    id: string,
    userId: string,
    input: ArchiveTrackerHabitInput,
  ): Promise<TrackerHabitRecord>
}
