import type { NotesRepository } from '@repositories/notes-repository'

interface FetchNotesInput {
  userId: string
  search?: string
}

interface NoteSummary {
  id: string
  title: string
  snippet: string
  createdAt: Date
  updatedAt: Date
}

interface FetchNotesOutput {
  notes: NoteSummary[]
}

const SNIPPET_MAX_LENGTH = 120

export class FetchNotesUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ userId, search }: FetchNotesInput): Promise<FetchNotesOutput> {
    const records = await this.notesRepository.findManyByUserId(userId, { search })

    const notes = records.map((r) => ({
      id: r.id,
      title: r.title,
      snippet: r.content.slice(0, SNIPPET_MAX_LENGTH),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    return { notes }
  }
}
