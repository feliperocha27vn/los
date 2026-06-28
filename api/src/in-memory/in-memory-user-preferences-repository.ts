import type {
  UserPreferencesRecord,
  UserPreferencesRepository,
} from '@repositories/user-preferences-repository'

export class InMemoryUserPreferencesRepository
  implements UserPreferencesRepository
{
  private prefs: UserPreferencesRecord[] = []

  async getByUserId(userId: string): Promise<UserPreferencesRecord | null> {
    return this.prefs.find((p) => p.userId === userId) ?? null
  }

  async update(
    userId: string,
    input: Partial<Omit<UserPreferencesRecord, 'userId'>>,
  ): Promise<UserPreferencesRecord> {
    const existing = await this.getByUserId(userId)
    if (existing) {
      if (input.notificationOffsetMinutes !== undefined) {
        existing.notificationOffsetMinutes = input.notificationOffsetMinutes
      }
      if (input.timezone !== undefined) existing.timezone = input.timezone
      return existing
    }
    const created: UserPreferencesRecord = {
      userId,
      notificationOffsetMinutes: input.notificationOffsetMinutes ?? 15,
      timezone: input.timezone ?? 'America/Sao_Paulo',
    }
    this.prefs.push(created)
    return created
  }
}
