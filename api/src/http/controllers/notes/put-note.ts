import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateNoteUseCase } from '@use-cases/update-note'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NotesRepository } from '@repositories/notes-repository'

export function putNoteRoute(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Update note',
        params: z.object({ id: z.string() }),
        body: z.object({
          title: z.string().min(1).optional(),
          content: z.string().optional(),
        }),
        response: {
          200: z.object({
            note: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
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
        const { title, content } = request.body

        const useCase = new UpdateNoteUseCase(notesRepository)
        const { note } = await useCase.execute({ noteId: id, userId, title, content })

        return reply.status(200).send({
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
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
