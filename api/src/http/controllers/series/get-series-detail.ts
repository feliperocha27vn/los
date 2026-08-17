import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRepository } from '@repositories/series-repository'
import { GetSeriesDetailUseCase } from '@use-cases/series/get-series-detail'
import { seriesResponseSchema, toResponse } from './series-response'

export function getSeriesDetailRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/series/:id', {
      schema: {
        tags: ['Series'],
        summary: 'Get series detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ series: seriesResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetSeriesDetailUseCase(seriesRepository)
        const { series } = await useCase.execute({ seriesId: id, userId })
        return reply.status(200).send({ series: toResponse(series) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
