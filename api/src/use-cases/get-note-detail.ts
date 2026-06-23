import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NoteRecord, NotesRepository } from '@repositories/notes-repository'

interface GetNoteDetailInput {
  noteId: string
  userId: string
}

interface GetNoteDetailOutput {
  note: NoteRecord
}

export class GetNoteDetailUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ noteId, userId }: GetNoteDetailInput): Promise<GetNoteDetailOutput> {
    const note = await this.notesRepository.findById(noteId, userId)
    if (!note) throw new ResourceNotFoundError()
    return { note }
  }
}
