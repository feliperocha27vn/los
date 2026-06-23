import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NotesRepository } from '@repositories/notes-repository'

interface DeleteNoteInput {
  noteId: string
  userId: string
}

export class DeleteNoteUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ noteId, userId }: DeleteNoteInput): Promise<void> {
    try {
      await this.notesRepository.delete(noteId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
