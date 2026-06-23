import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { notes } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateNoteInput,
  NoteRecord,
  NotesRepository,
  UpdateNoteInput,
} from '@repositories/notes-repository'

class DrizzleNotesRepository implements NotesRepository {
  async findById(id: string, userId: string): Promise<NoteRecord | null> {
    const result = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1)
    return result[0] ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { search?: string }
  ): Promise<NoteRecord[]> {
    const conditions = [eq(notes.userId, userId)]

    if (filters?.search) {
      const term = `%${filters.search}%`
      conditions.push(
        or(ilike(notes.title, term), ilike(notes.content, term))!
      )
    }

    return db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.updatedAt))
  }

  async create(input: CreateNoteInput): Promise<NoteRecord> {
    const [note] = await db.insert(notes).values(input).returning()
    return note
  }

  async update(
    id: string,
    userId: string,
    input: UpdateNoteInput
  ): Promise<NoteRecord> {
    const [note] = await db
      .update(notes)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning()
    if (!note) throw new Error('Note not found')
    return note
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    if (result.count === 0) throw new Error('Note not found')
  }
}

export const notesRepository = new DrizzleNotesRepository()
