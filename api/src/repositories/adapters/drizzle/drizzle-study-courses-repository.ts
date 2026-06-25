import { and, asc, eq } from 'drizzle-orm'
import { studyCourses } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateStudyCourseInput,
  ReorderStudyCourseInput,
  StudyCourseRecord,
  StudyCoursesRepository,
  UpdateStudyCourseInput,
} from '@repositories/study-courses-repository'

function toRecord(row: typeof studyCourses.$inferSelect): StudyCourseRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleStudyCoursesRepository implements StudyCoursesRepository {
  async findById(id: string, userId: string): Promise<StudyCourseRecord | null> {
    const rows = await db
      .select()
      .from(studyCourses)
      .where(and(eq(studyCourses.id, id), eq(studyCourses.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(userId: string): Promise<StudyCourseRecord[]> {
    const rows = await db
      .select()
      .from(studyCourses)
      .where(eq(studyCourses.userId, userId))
      .orderBy(asc(studyCourses.position))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: studyCourses.id })
      .from(studyCourses)
      .where(eq(studyCourses.userId, userId))
    return rows.length
  }

  async create(input: CreateStudyCourseInput): Promise<StudyCourseRecord> {
    const [row] = await db.insert(studyCourses).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyCourseInput,
  ): Promise<StudyCourseRecord> {
    const [row] = await db
      .update(studyCourses)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(studyCourses.id, id), eq(studyCourses.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyCourse not found')
    return toRecord(row)
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyCourseInput,
  ): Promise<StudyCourseRecord> {
    const [row] = await db
      .update(studyCourses)
      .set({ position: input.position, updatedAt: new Date() })
      .where(and(eq(studyCourses.id, id), eq(studyCourses.userId, userId)))
      .returning()
    if (!row) throw new Error('StudyCourse not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(studyCourses)
      .where(and(eq(studyCourses.id, id), eq(studyCourses.userId, userId)))
    if (result.count === 0) throw new Error('StudyCourse not found')
  }
}

export const studyCoursesRepository = new DrizzleStudyCoursesRepository()
