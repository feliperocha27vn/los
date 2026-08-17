import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRepository } from '@repositories/series-repository'
import { DeleteSeriesUseCase } from '@use-cases/series/delete-series'

export function deleteSeriesRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/series/:id', {
      schema: {
        tags: ['Series'],
        summary: 'Delete series',
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
        const useCase = new DeleteSeriesUseCase(seriesRepository)
        await useCase.execute({ seriesId: id, userId })
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
