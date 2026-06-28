export interface UserPreferencesRecord {
  userId: string
  notificationOffsetMinutes: number
  timezone: string
}

export interface UserPreferencesRepository {
  getByUserId(userId: string): Promise<UserPreferencesRecord | null>
  update(
    userId: string,
    input: Partial<Omit<UserPreferencesRecord, 'userId'>>,
  ): Promise<UserPreferencesRecord>
}
