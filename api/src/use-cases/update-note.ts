import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NoteRecord, NotesRepository, UpdateNoteInput } from '@repositories/notes-repository'

interface UpdateNotePayload {
  noteId: string
  userId: string
  title?: string
  content?: string
}

interface UpdateNoteOutput {
  note: NoteRecord
}

export class UpdateNoteUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ noteId, userId, ...data }: UpdateNotePayload): Promise<UpdateNoteOutput> {
    const input: UpdateNoteInput = {}
    if (data.title !== undefined) input.title = data.title
    if (data.content !== undefined) input.content = data.content

    try {
      const note = await this.notesRepository.update(noteId, userId, input)
      return { note }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
