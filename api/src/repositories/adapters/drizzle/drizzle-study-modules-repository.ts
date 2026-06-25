import { and, asc, eq } from 'drizzle-orm'
import { studyModules } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateStudyModuleInput,
  ReorderStudyModuleInput,
  StudyModuleRecord,
  StudyModulesRepository,
  UpdateStudyModuleInput,
} from '@repositories/study-modules-repository'

function toRecord(row: typeof studyModules.$inferSelect): StudyModuleRecord {
  return {
    id: row.id,
    courseId: row.courseId,
    userId: row.userId,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleStudyModulesRepository implements StudyModulesRepository {
  async findById(id: string, userId: string): Promise<StudyModuleRecord | null> {
    const rows = await db
      .select()
      .from(studyModules)
      .where(and(eq(studyModules.id, id), eq(studyModules.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filters?: { courseId?: string },
  ): Promise<StudyModuleRecord[]> {
    const conditions = [eq(studyModules.userId, userId)]
    if (filters?.courseId) {
      conditions.push(eq(studyModules.courseId, filters.courseId))
    }
    const rows = await db
      .select()
      .from(studyModules)
      .where(and(...conditions))
      .orderBy(asc(studyModules.position))
    return rows.map(toRecord)
  }

  async countByCourseId(courseId: string, userId: string): Promise<number> {
    const rows = await db
      .select({ id: studyModules.id })
      .from(studyModules)
      .where(and(eq(studyModules.courseId, courseId), eq(studyModules.userId, userId)))
    return rows.length
  }

  async create(input: CreateStudyModuleInput): Promise<StudyModuleRecord> {
    const [row] = await db.insert(studyModules).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyModuleInput,
  ): Promise<StudyModuleRecord> {
    const [row] = await db
      .update(studyModules)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(studyModules.id, id), eq(studyModules.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyModule not found')
    return toRecord(row)
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyModuleInput,
  ): Promise<StudyModuleRecord> {
    const [row] = await db
      .update(studyModules)
      .set({ position: input.position, updatedAt: new Date() })
      .where(and(eq(studyModules.id, id), eq(studyModules.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyModule not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(studyModules)
      .where(and(eq(studyModules.id, id), eq(studyModules.userId, userId)))
    if (result.count === 0) throw new Error('StudyModule not found')
  }
}

export const studyModulesRepository = new DrizzleStudyModulesRepository()
