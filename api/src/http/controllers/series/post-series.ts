import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { SeriesLimitExceededError } from '@errors/series-limit-exceeded-error'
import type { SeriesRepository } from '@repositories/series-repository'
import { CreateSeriesUseCase } from '@use-cases/series/create-series'
import {
  episodeSchema,
  positionSecondsSchema,
  seasonSchema,
  seriesResponseSchema,
  toResponse,
} from './series-response'

export function postSeriesRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/series', {
      schema: {
        tags: ['Series'],
        summary: 'Create series',
        body: z.object({
          name: z.string().min(1).max(150),
          season: seasonSchema.optional(),
          episode: episodeSchema.optional(),
          positionSeconds: positionSecondsSchema.optional(),
        }),
        response: {
          201: z.object({ series: seriesResponseSchema }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { name, season, episode, positionSeconds } = request.body
      const useCase = new CreateSeriesUseCase(seriesRepository)
      try {
        const { series } = await useCase.execute({
          userId,
          name,
          season,
          episode,
          positionSeconds,
        })
        return reply.status(201).send({ series: toResponse(series) })
      } catch (error) {
        if (error instanceof SeriesLimitExceededError) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
