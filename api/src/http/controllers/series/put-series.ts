import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRepository } from '@repositories/series-repository'
import { UpdateSeriesUseCase } from '@use-cases/series/update-series'
import {
  episodeSchema,
  positionSecondsSchema,
  seasonSchema,
  seriesResponseSchema,
  seriesStateSchema,
  toResponse,
} from './series-response'

export function putSeriesRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/series/:id', {
      schema: {
        tags: ['Series'],
        summary: 'Update series (name, state and marcador)',
        params: z.object({ id: z.string() }),
        body: z.object({
          name: z.string().min(1).max(150).optional(),
          state: seriesStateSchema.optional(),
          season: seasonSchema.optional(),
          episode: episodeSchema.optional(),
          positionSeconds: positionSecondsSchema.optional(),
        }),
        response: {
          200: z.object({ series: seriesResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { name, state, season, episode, positionSeconds } = request.body
        const useCase = new UpdateSeriesUseCase(seriesRepository)
        const { series } = await useCase.execute({
          seriesId: id,
          userId,
          name,
          state,
          season,
          episode,
          positionSeconds,
        })
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
