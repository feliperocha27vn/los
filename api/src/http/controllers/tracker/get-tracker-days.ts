import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import { GetTrackerDaysUseCase } from '@use-cases/tracker-records/get-tracker-days'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const dayHistoryItemSchema = z.object({
  habitId: z.string(),
  name: z.string(),
  icon: z.string(),
  completed: z.boolean(),
  recordId: z.string(),
})

const dayHistorySchema = z.object({
  date: z.string(),
  habits: dayHistoryItemSchema.array(),
  energy: z.enum(['low', 'medium', 'high']).nullable(),
  quality: z.enum(['weak', 'ok', 'strong']).nullable(),
  score: z.object({ completed: z.number(), total: z.number() }),
})

const daysResponseSchema = z.object({
  days: dayHistorySchema.array(),
})

export function getTrackerDaysRoute(
  trackerHabitsRepository: TrackerHabitsRepository,
  trackerRecordsRepository: TrackerRecordsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/tracker/days',
      {
        schema: {
          tags: ['TrackerViews'],
          summary: 'Get days range (history)',
          querystring: z.object({
            from: z.string().regex(dateRegex).optional(),
            to: z.string().regex(dateRegex).optional(),
          }),
          response: {
            200: daysResponseSchema,
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { from, to } = request.query
        const useCase = new GetTrackerDaysUseCase(trackerHabitsRepository, trackerRecordsRepository)
        try {
          const result = await useCase.execute({ userId, from, to })
          return reply.status(200).send(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro'
          return reply.status(400).send({ message })
        }
      },
    )
  }
}
