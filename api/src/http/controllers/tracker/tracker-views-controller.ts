import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getTrackerDaysRoute } from './get-tracker-days'
import { getTrackerTodayRoute } from './get-tracker-today'

export function makeTrackerViewsController(
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(getTrackerTodayRoute(trackerHabitsRepository, trackerRecordsRepository))
    await app.register(getTrackerDaysRoute(trackerHabitsRepository, trackerRecordsRepository))
  }
}
