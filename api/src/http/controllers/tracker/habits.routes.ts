import type { FastifyInstance } from 'fastify'
import { getTrackerHabitsRoute } from './get-tracker-habits'
import { postTrackerHabitRoute } from './post-tracker-habit'
import { getTrackerHabitDetailRoute } from './get-tracker-habit-detail'
import { putTrackerHabitRoute } from './put-tracker-habit'
import { patchTrackerHabitReorderRoute } from './patch-tracker-habit-reorder'
import { deleteTrackerHabitRoute } from './delete-tracker-habit'
import { patchTrackerHabitRestoreRoute } from './patch-tracker-habit-restore'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'

export function registerTrackerHabitsRoutes(
  app: FastifyInstance,
  trackerHabitsRepository: TrackerHabitsRepository
): void {
  app
    .register(getTrackerHabitsRoute(trackerHabitsRepository))
    .register(postTrackerHabitRoute(trackerHabitsRepository))
    .register(getTrackerHabitDetailRoute(trackerHabitsRepository))
    .register(putTrackerHabitRoute(trackerHabitsRepository))
    .register(patchTrackerHabitReorderRoute(trackerHabitsRepository))
    .register(deleteTrackerHabitRoute(trackerHabitsRepository))
    .register(patchTrackerHabitRestoreRoute(trackerHabitsRepository))
}
