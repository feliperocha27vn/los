import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { deleteTrackerRecordRoute } from './delete-tracker-record'
import { putTrackerRecordRoute } from './put-tracker-record'

export function makeTrackerRecordsController(
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(putTrackerRecordRoute(trackerRecordsRepository, trackerHabitsRepository))
    await app.register(deleteTrackerRecordRoute(trackerRecordsRepository))
  }
}
