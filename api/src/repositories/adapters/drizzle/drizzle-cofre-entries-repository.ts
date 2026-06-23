import { and, eq, ilike, or } from 'drizzle-orm'
import { cofreEntries } from '@db/schema'
import { db } from '@lib/db'
import type {
  CofreCategory,
  CofreEntriesRepository,
  CofreEntryRecord,
  CreateCofreEntryInput,
  UpdateCofreEntryInput,
} from '@repositories/cofre-entries-repository'

class DrizzleCofreEntriesRepository implements CofreEntriesRepository {
  async findById(
    id: string,
    userId: string
  ): Promise<CofreEntryRecord | null> {
    const result = await db
      .select()
      .from(cofreEntries)
      .where(and(eq(cofreEntries.id, id), eq(cofreEntries.userId, userId)))
      .limit(1)

    return result[0] ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { category?: CofreCategory; search?: string }
  ): Promise<CofreEntryRecord[]> {
    const conditions = [eq(cofreEntries.userId, userId)]

    if (filters?.category) {
      conditions.push(eq(cofreEntries.category, filters.category))
    }

    if (filters?.search) {
      const term = `%${filters.search}%`
      conditions.push(
        or(
          ilike(cofreEntries.title, term),
          ilike(cofreEntries.username, term),
          ilike(cofreEntries.url, term),
          ilike(cofreEntries.provider, term)
        )!
      )
    }

    return db
      .select()
      .from(cofreEntries)
      .where(and(...conditions))
      .orderBy(cofreEntries.updatedAt)
  }

  async create(input: CreateCofreEntryInput): Promise<CofreEntryRecord> {
    const [entry] = await db.insert(cofreEntries).values(input).returning()
    return entry
  }

  async update(
    id: string,
    userId: string,
    input: UpdateCofreEntryInput
  ): Promise<CofreEntryRecord> {
    const [entry] = await db
      .update(cofreEntries)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(cofreEntries.id, id), eq(cofreEntries.userId, userId)))
      .returning()

    if (!entry) {
      throw new Error('Entry not found')
    }

    return entry
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(cofreEntries)
      .where(and(eq(cofreEntries.id, id), eq(cofreEntries.userId, userId)))

    if (result.count === 0) {
      throw new Error('Entry not found')
    }
  }
}

export const cofreEntriesRepository = new DrizzleCofreEntriesRepository()
