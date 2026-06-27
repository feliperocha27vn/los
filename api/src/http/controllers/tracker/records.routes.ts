import type { FastifyInstance } from 'fastify'
import { putTrackerRecordRoute } from './put-tracker-record'
import { deleteTrackerRecordRoute } from './delete-tracker-record'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'

export function registerTrackerRecordsRoutes(
  app: FastifyInstance,
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository
): void {
  app
    .register(putTrackerRecordRoute(trackerRecordsRepository, trackerHabitsRepository))
    .register(deleteTrackerRecordRoute(trackerRecordsRepository))
}
