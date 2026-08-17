import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import type { SeriesRepository } from '@repositories/series-repository'
import { FetchSeriesUseCase } from '@use-cases/series/fetch-series'
import { seriesResponseSchema, seriesStateSchema, toResponse } from './series-response'

export function getSeriesRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/series', {
      schema: {
        tags: ['Series'],
        summary: 'List series (most recently watched first)',
        querystring: z.object({ state: seriesStateSchema.optional() }),
        response: { 200: z.object({ series: seriesResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { state } = request.query
      const useCase = new FetchSeriesUseCase(seriesRepository)
      const { series } = await useCase.execute({ userId, state })
      return reply.status(200).send({ series: series.map(toResponse) })
    })
  }
}
