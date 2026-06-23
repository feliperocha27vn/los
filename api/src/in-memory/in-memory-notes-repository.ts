import type {
  CreateNoteInput,
  NoteRecord,
  NotesRepository,
  UpdateNoteInput,
} from '@repositories/notes-repository'

export class InMemoryNotesRepository implements NotesRepository {
  private notes: NoteRecord[] = []

  async findById(id: string, userId: string): Promise<NoteRecord | null> {
    return this.notes.find((n) => n.id === id && n.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { search?: string }
  ): Promise<NoteRecord[]> {
    let result = this.notes.filter((n) => n.userId === userId)

    if (filters?.search) {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.content.toLowerCase().includes(term)
      )
    }

    return result.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  async create(input: CreateNoteInput): Promise<NoteRecord> {
    const note: NoteRecord = {
      id: input.id,
      userId: input.userId,
      title: input.title,
      content: input.content ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.notes.push(note)
    return note
  }

  async update(
    id: string,
    userId: string,
    input: UpdateNoteInput
  ): Promise<NoteRecord> {
    const note = this.notes.find((n) => n.id === id && n.userId === userId)
    if (!note) throw new Error('Note not found')

    if (input.title !== undefined) note.title = input.title
    if (input.content !== undefined) note.content = input.content
    note.updatedAt = new Date()

    return note
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.notes.findIndex(
      (n) => n.id === id && n.userId === userId
    )
    if (index === -1) throw new Error('Note not found')
    this.notes.splice(index, 1)
  }
}
