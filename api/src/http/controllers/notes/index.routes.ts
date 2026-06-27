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
  app
    .register(getNotesRoute(notesRepository))
    .register(getNoteDetailRoute(notesRepository))
    .register(postNoteRoute(notesRepository))
    .register(putNoteRoute(notesRepository))
    .register(deleteNoteRoute(notesRepository))
}
