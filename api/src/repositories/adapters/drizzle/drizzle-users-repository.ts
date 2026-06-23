import { eq, sql } from 'drizzle-orm'
import { users } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateUserInput,
  UserRecord,
  UsersRepository,
} from '@repositories/users-repository'

class DrizzleUsersRepository implements UsersRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    return result[0] ?? null
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const [user] = await db.insert(users).values(input).returning()
    return user
  }

  async incrementPinAttempts(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ pinAttempts: sql`${users.pinAttempts} + 1` } as never)
      .where(eq(users.id, userId))
  }

  async resetPinAttempts(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ pinAttempts: 0, pinLockedUntil: null })
      .where(eq(users.id, userId))
  }

  async setPinLockedUntil(userId: string, lockedUntil: Date): Promise<void> {
    await db
      .update(users)
      .set({ pinLockedUntil: lockedUntil })
      .where(eq(users.id, userId))
  }
}

export const usersRepository = new DrizzleUsersRepository()
