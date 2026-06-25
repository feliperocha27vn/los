import { and, asc, eq } from 'drizzle-orm'
import { studyPages } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateStudyPageInput,
  ReorderStudyPageInput,
  StudyPageRecord,
  StudyPagesRepository,
  UpdateStudyPageInput,
} from '@repositories/study-pages-repository'

function toRecord(row: typeof studyPages.$inferSelect): StudyPageRecord {
  return {
    id: row.id,
    moduleId: row.moduleId,
    userId: row.userId,
    title: row.title,
    content: row.content,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleStudyPagesRepository implements StudyPagesRepository {
  async findById(id: string, userId: string): Promise<StudyPageRecord | null> {
    const rows = await db
      .select()
      .from(studyPages)
      .where(and(eq(studyPages.id, id), eq(studyPages.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { moduleId?: string },
  ): Promise<StudyPageRecord[]> {
    const conditions = [eq(studyPages.userId, userId)]
    if (filters?.moduleId) {
      conditions.push(eq(studyPages.moduleId, filters.moduleId))
    }
    const rows = await db
      .select()
      .from(studyPages)
      .where(and(...conditions))
      .orderBy(asc(studyPages.position))
    return rows.map(toRecord)
  }

  async countByModuleId(moduleId: string, userId: string): Promise<number> {
    const rows = await db
      .select({ id: studyPages.id })
      .from(studyPages)
      .where(and(eq(studyPages.moduleId, moduleId), eq(studyPages.userId, userId)))
    return rows.length
  }

  async create(input: CreateStudyPageInput): Promise<StudyPageRecord> {
    const [row] = await db.insert(studyPages).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyPageInput,
  ): Promise<StudyPageRecord> {
    const [row] = await db
      .update(studyPages)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(studyPages.id, id), eq(studyPages.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyPage not found')
    return toRecord(row)
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyPageInput,
  ): Promise<StudyPageRecord> {
    const [row] = await db
      .update(studyPages)
      .set({ position: input.position, updatedAt: new Date() })
      .where(and(eq(studyPages.id, id), eq(studyPages.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyPage not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(studyPages)
      .where(and(eq(studyPages.id, id), eq(studyPages.userId, userId)))
    if (result.count === 0) throw new Error('StudyPage not found')
  }
}

export const studyPagesRepository = new DrizzleStudyPagesRepository()
