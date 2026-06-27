import type { FastifyInstance } from 'fastify'
import { getNotesRoute } from './get-notes'
import { getNoteDetailRoute } from './get-note-detail'
import { postNoteRoute } from './post-note'
import { putNoteRoute } from './put-note'
import { deleteNoteRoute } from './delete-note'
import type { NotesRepository } from '@repositories/notes-repository'

export function registerNotesRoutes(
  app: FastifyInstance,
  notesRepository: NotesRepository
): void {
  void app.register(getNotesRoute(notesRepository))
  void app.register(getNoteDetailRoute(notesRepository))
  void app.register(postNoteRoute(notesRepository))
  void app.register(putNoteRoute(notesRepository))
  void app.register(deleteNoteRoute(notesRepository))
}
