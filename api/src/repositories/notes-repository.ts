export interface NoteRecord {
  id: string
  userId: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export type CreateNoteInput = Pick<NoteRecord, 'id' | 'userId' | 'title'> & {
  content?: string
}

export type UpdateNoteInput = Partial<Pick<NoteRecord, 'title' | 'content'>>

export interface NotesRepository {
  findById(id: string, userId: string): Promise<NoteRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { search?: string }
  ): Promise<NoteRecord[]>
  create(input: CreateNoteInput): Promise<NoteRecord>
  update(id: string, userId: string, input: UpdateNoteInput): Promise<NoteRecord>
  delete(id: string, userId: string): Promise<void>
}
