import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { FetchTrackerHabitsUseCase } from '@use-cases/tracker-habits/fetch-tracker-habits'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { habitResponseSchema, toResponse } from './habit-response'

export function getTrackerHabitsRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/tracker/habits',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'List tracker habits',
          querystring: z.object({ includeArchived: z.coerce.boolean().optional() }),
          response: { 200: z.object({ habits: habitResponseSchema.array() }) },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { includeArchived } = request.query
        const useCase = new FetchTrackerHabitsUseCase(trackerHabitsRepository)
        const { habits } = await useCase.execute({ userId, includeArchived })
        return reply.status(200).send({ habits: habits.map(toResponse) })
      },
    )
  }
}
