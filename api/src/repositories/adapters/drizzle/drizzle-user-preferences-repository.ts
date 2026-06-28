import { eq } from 'drizzle-orm'
import { users } from '@db/schema'
import { db } from '@lib/db'
import type {
  UserPreferencesRecord,
  UserPreferencesRepository,
} from '@repositories/user-preferences-repository'

class DrizzleUserPreferencesRepository implements UserPreferencesRepository {
  async getByUserId(userId: string): Promise<UserPreferencesRecord | null> {
    const rows = await db
      .select({
        userId: users.id,
        notificationOffsetMinutes: users.notificationOffsetMinutes,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return rows[0] ?? null
  }

  async update(
    userId: string,
    input: Partial<Omit<UserPreferencesRecord, 'userId'>>,
  ): Promise<UserPreferencesRecord> {
    const [row] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        userId: users.id,
        notificationOffsetMinutes: users.notificationOffsetMinutes,
        timezone: users.timezone,
      })
    if (!row) throw new Error('User not found')
    return row
  }
}

export const userPreferencesRepository = new DrizzleUserPreferencesRepository()
