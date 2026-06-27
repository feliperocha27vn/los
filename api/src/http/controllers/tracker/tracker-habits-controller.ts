import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { deleteTrackerHabitRoute } from './delete-tracker-habit'
import { getTrackerHabitDetailRoute } from './get-tracker-habit-detail'
import { getTrackerHabitsRoute } from './get-tracker-habits'
import { patchTrackerHabitReorderRoute } from './patch-tracker-habit-reorder'
import { patchTrackerHabitRestoreRoute } from './patch-tracker-habit-restore'
import { postTrackerHabitRoute } from './post-tracker-habit'
import { putTrackerHabitRoute } from './put-tracker-habit'

export function makeTrackerHabitsController(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(getTrackerHabitsRoute(trackerHabitsRepository))
    await app.register(postTrackerHabitRoute(trackerHabitsRepository))
    await app.register(getTrackerHabitDetailRoute(trackerHabitsRepository))
    await app.register(putTrackerHabitRoute(trackerHabitsRepository))
    await app.register(patchTrackerHabitReorderRoute(trackerHabitsRepository))
    await app.register(deleteTrackerHabitRoute(trackerHabitsRepository))
    await app.register(patchTrackerHabitRestoreRoute(trackerHabitsRepository))
  }
}
