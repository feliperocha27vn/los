import type { FastifyInstance } from 'fastify'
import type { SeriesRepository } from '@repositories/series-repository'
import { getSeriesRoute } from './get-series'
import { postSeriesRoute } from './post-series'
import { getSeriesDetailRoute } from './get-series-detail'
import { putSeriesRoute } from './put-series'
import { patchSeriesAdvanceRoute } from './patch-series-advance'
import { deleteSeriesRoute } from './delete-series'

export function registerSeriesRoutes(
  app: FastifyInstance,
  seriesRepository: SeriesRepository
): void {
  app
    .register(getSeriesRoute(seriesRepository))
    .register(postSeriesRoute(seriesRepository))
    .register(getSeriesDetailRoute(seriesRepository))
    .register(putSeriesRoute(seriesRepository))
    .register(patchSeriesAdvanceRoute(seriesRepository))
    .register(deleteSeriesRoute(seriesRepository))
}
