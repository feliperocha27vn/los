import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetNoteDetailUseCase } from '@use-cases/get-note-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NotesRepository } from '@repositories/notes-repository'

export function getNoteDetailRoute(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Get note detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            note: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params

        const useCase = new GetNoteDetailUseCase(notesRepository)
        const { note } = await useCase.execute({ noteId: id, userId })

        return reply.status(200).send({
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
