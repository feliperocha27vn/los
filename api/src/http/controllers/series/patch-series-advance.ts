import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRepository } from '@repositories/series-repository'
import { AdvanceSeriesUseCase } from '@use-cases/series/advance-series'
import { seriesResponseSchema, toResponse } from './series-response'

export function patchSeriesAdvanceRoute(
  seriesRepository: SeriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch('/series/:id/advance', {
      schema: {
        tags: ['Series'],
        summary: 'Advance marcador to the next episode',
        params: z.object({ id: z.string() }),
        // nullish, não optional: o botão "avançar" dispara um PATCH sem corpo
        // nenhum, e nesse caso o Fastify entrega `null` ao validador.
        body: z.object({ nextSeason: z.boolean().optional() }).nullish(),
        response: {
          200: z.object({ series: seriesResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { nextSeason } = request.body ?? {}
        const useCase = new AdvanceSeriesUseCase(seriesRepository)
        const { series } = await useCase.execute({
          seriesId: id,
          userId,
          nextSeason,
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
