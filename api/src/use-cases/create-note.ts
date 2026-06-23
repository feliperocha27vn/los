import { randomUUID } from 'node:crypto'
import type { NoteRecord, NotesRepository } from '@repositories/notes-repository'

interface CreateNoteInput {
  userId: string
  title: string
}

interface CreateNoteOutput {
  note: NoteRecord
}

export class CreateNoteUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ userId, title }: CreateNoteInput): Promise<CreateNoteOutput> {
    const note = await this.notesRepository.create({
      id: randomUUID(),
      userId,
      title,
      content: '',
    })

    return { note }
  }
}
