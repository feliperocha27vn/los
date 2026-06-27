import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import { ArchiveTrackerHabitUseCase } from '@use-cases/tracker-habits/archive-tracker-habit'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function deleteTrackerHabitRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete(
      '/tracker/habits/:id',
      {
        schema: {
          tags: ['TrackerHabits'],
          summary: 'Archive tracker habit (soft delete)',
          params: z.object({ id: z.string() }),
          response: {
            204: z.void(),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params
          const useCase = new ArchiveTrackerHabitUseCase(trackerHabitsRepository)
          await useCase.execute({ habitId: id, userId })
          return reply.status(204).send()
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
