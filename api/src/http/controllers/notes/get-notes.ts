import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchNotesUseCase } from '@use-cases/fetch-notes'
import type { NotesRepository } from '@repositories/notes-repository'

export function getNotesRoute(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/notes', {
      schema: {
        tags: ['Notes'],
        summary: 'List notes',
        querystring: z.object({ search: z.string().optional() }),
        response: {
          200: z.object({
            notes: z
              .object({
                id: z.string(),
                title: z.string(),
                snippet: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .array(),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { search } = request.query

      const useCase = new FetchNotesUseCase(notesRepository)
      const { notes } = await useCase.execute({ userId, search })

      return reply.status(200).send({
        notes: notes.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        })),
      })
    })
  }
}
