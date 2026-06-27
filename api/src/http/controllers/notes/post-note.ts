import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateNoteUseCase } from '@use-cases/create-note'
import type { NotesRepository } from '@repositories/notes-repository'

export function postNoteRoute(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/notes', {
      schema: {
        tags: ['Notes'],
        summary: 'Create note',
        body: z.object({ title: z.string().min(1) }),
        response: {
          201: z.object({
            note: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { title } = request.body

      const useCase = new CreateNoteUseCase(notesRepository)
      const { note } = await useCase.execute({ userId, title })

      return reply.status(201).send({
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      })
    })
  }
}
