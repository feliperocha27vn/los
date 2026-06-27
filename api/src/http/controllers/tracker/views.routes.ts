import type { FastifyInstance } from 'fastify'
import { getTrackerTodayRoute } from './get-tracker-today'
import { getTrackerDaysRoute } from './get-tracker-days'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'

export function registerTrackerViewsRoutes(
  app: FastifyInstance,
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository
): void {
  app
    .register(getTrackerTodayRoute(trackerHabitsRepository, trackerRecordsRepository))
    .register(getTrackerDaysRoute(trackerHabitsRepository, trackerRecordsRepository))
}
