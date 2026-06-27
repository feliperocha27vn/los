import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { ReorderTrackerHabitUseCase } from '@use-cases/tracker-habits/reorder-tracker-habit'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function patchTrackerHabitReorderRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch(
      '/tracker/habits/:id/reorder',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Reorder tracker habit',
          params: z.object({ id: z.string() }),
          body: z.object({ position: z.number().positive() }),
          response: {
            200: z.object({
              habit: z.object({
                id: z.string(),
                position: z.number(),
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
          const { position } = request.body
          const useCase = new ReorderTrackerHabitUseCase(trackerHabitsRepository)
          const { habit } = await useCase.execute({
            habitId: id,
            userId,
            position,
          })
          return reply.status(200).send({
            habit: {
              id: habit.id,
              position: Number(habit.position),
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
