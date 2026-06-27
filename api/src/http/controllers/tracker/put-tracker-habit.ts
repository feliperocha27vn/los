import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { UpdateTrackerHabitUseCase } from '@use-cases/tracker-habits/update-tracker-habit'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function putTrackerHabitRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put(
      '/tracker/habits/:id',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Update tracker habit',
          params: z.object({ id: z.string() }),
          body: z.object({
            name: z.string().min(1).max(50).optional(),
            icon: z.string().min(1).max(50).optional(),
          }),
          response: {
            200: z.object({
              habit: z.object({
                id: z.string(),
                name: z.string(),
                icon: z.string(),
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
          const { name, icon } = request.body
          const useCase = new UpdateTrackerHabitUseCase(trackerHabitsRepository)
          const { habit } = await useCase.execute({ habitId: id, userId, name, icon })
          return reply.status(200).send({
            habit: {
              id: habit.id,
              name: habit.name,
              icon: habit.icon,
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
