import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteNoteUseCase } from '@use-cases/delete-note'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NotesRepository } from '@repositories/notes-repository'

export function deleteNoteRoute(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Delete note',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params

        const useCase = new DeleteNoteUseCase(notesRepository)
        await useCase.execute({ noteId: id, userId })

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
