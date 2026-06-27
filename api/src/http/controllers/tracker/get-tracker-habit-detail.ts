import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { GetTrackerHabitDetailUseCase } from '@use-cases/tracker-habits/get-tracker-habit-detail'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { habitResponseSchema, toResponse } from './habit-response'

export function getTrackerHabitDetailRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/tracker/habits/:id',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Get tracker habit detail',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({ habit: habitResponseSchema }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params
          const useCase = new GetTrackerHabitDetailUseCase(trackerHabitsRepository)
          const { habit } = await useCase.execute({ habitId: id, userId })
          return reply.status(200).send({ habit: toResponse(habit) })
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
