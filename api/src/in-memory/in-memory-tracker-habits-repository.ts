import type {
  ArchiveTrackerHabitInput,
  CreateTrackerHabitInput,
  ReorderTrackerHabitInput,
  TrackerHabitRecord,
  TrackerHabitsRepository,
  UpdateTrackerHabitInput,
} from '@repositories/tracker-habits-repository'

export class InMemoryTrackerHabitsRepository implements TrackerHabitsRepository {
  private habits: TrackerHabitRecord[] = []

  async findById(id: string, userId: string): Promise<TrackerHabitRecord | null> {
    return this.habits.find((h) => h.id === id && h.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { includeArchived?: boolean },
  ): Promise<TrackerHabitRecord[]> {
    let result = this.habits.filter((h) => h.userId === userId)
    if (!filters?.includeArchived) {
      result = result.filter((h) => !h.archived)
    }
    return result.sort((a, b) => Number(a.position) - Number(b.position))
  }

  async countByUserId(userId: string): Promise<number> {
    return this.habits.filter((h) => h.userId === userId).length
  }

  async create(input: CreateTrackerHabitInput): Promise<TrackerHabitRecord> {
    const habit: TrackerHabitRecord = {
      id: input.id,
      userId: input.userId,
      name: input.name,
      icon: input.icon,
      position: input.position,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.habits.push(habit)
    return habit
  }

  async update(
    id: string,
    userId: string,
    input: UpdateTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const habit = this.habits.find((h) => h.id === id && h.userId === userId)
    if (!habit) throw new Error('TrackerHabit not found')
    if (input.name !== undefined) habit.name = input.name
    if (input.icon !== undefined) habit.icon = input.icon
    habit.updatedAt = new Date()
    return habit
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const habit = this.habits.find((h) => h.id === id && h.userId === userId)
    if (!habit) throw new Error('TrackerHabit not found')
    habit.position = input.position
    habit.updatedAt = new Date()
    return habit
  }

  async setArchived(
    id: string,
    userId: string,
    input: ArchiveTrackerHabitInput,
  ): Promise<TrackerHabitRecord> {
    const habit = this.habits.find((h) => h.id === id && h.userId === userId)
    if (!habit) throw new Error('TrackerHabit not found')
    habit.archived = input.archived
    habit.updatedAt = new Date()
    return habit
  }
}
