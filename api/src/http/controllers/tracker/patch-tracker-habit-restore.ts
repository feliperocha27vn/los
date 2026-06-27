import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { RestoreTrackerHabitUseCase } from '@use-cases/tracker-habits/restore-tracker-habit'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function patchTrackerHabitRestoreRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch(
      '/tracker/habits/:id/restore',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Restore archived tracker habit',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({
              habit: z.object({
                id: z.string(),
                name: z.string(),
                icon: z.string(),
                archived: z.boolean(),
                updatedAt: z.string(),
              }),
            }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params
          const useCase = new RestoreTrackerHabitUseCase(trackerHabitsRepository)
          const { habit } = await useCase.execute({ habitId: id, userId })
          return reply.status(200).send({
            habit: {
              id: habit.id,
              name: habit.name,
              icon: habit.icon,
              archived: habit.archived,
              updatedAt: habit.updatedAt.toISOString(),
            },
          })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
