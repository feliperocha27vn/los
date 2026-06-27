import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import { GetTrackerTodayUseCase } from '@use-cases/tracker-records/get-tracker-today'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

const todayItemSchema = z.object({
  habitId: z.string(),
  name: z.string(),
  icon: z.string(),
  completed: z.boolean(),
  recordId: z.string().nullable(),
})

const todayResponseSchema = z.object({
  date: z.string(),
  habits: todayItemSchema.array(),
  energy: z.enum(['low', 'medium', 'high']).nullable(),
  quality: z.enum(['weak', 'ok', 'strong']).nullable(),
  score: z.object({ completed: z.number(), total: z.number() }),
})

export function getTrackerTodayRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
  trackerRecordsRepository: TrackerRecordsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/tracker/today',
      {
        schema: {
          tags: ['TrackerViews'],
          summary: 'Get today tracker view (habits + records of today)',
          response: { 200: todayResponseSchema },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const useCase = new GetTrackerTodayUseCase(
          trackerHabitsRepository,
          trackerRecordsRepository,
        )
        const result = await useCase.execute({ userId })
        return reply.status(200).send(result)
      },
    )
  }
}
