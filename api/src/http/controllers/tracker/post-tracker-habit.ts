import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { CreateTrackerHabitUseCase } from '@use-cases/tracker-habits/create-tracker-habit'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { habitResponseSchema, toResponse } from './habit-response'

export function postTrackerHabitRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post(
      '/tracker/habits',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Create tracker habit',
          body: z.object({
            name: z.string().min(1).max(50),
            icon: z.string().min(1).max(50),
          }),
          response: {
            201: z.object({ habit: habitResponseSchema }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { name, icon } = request.body
        const useCase = new CreateTrackerHabitUseCase(trackerHabitsRepository)
        try {
          const { habit } = await useCase.execute({ userId, name, icon })
          return reply.status(201).send({ habit: toResponse(habit) })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro'
          return reply.status(400).send({ message })
        }
      },
    )
  }
}
