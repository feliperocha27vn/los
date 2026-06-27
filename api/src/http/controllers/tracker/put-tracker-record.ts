import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import { UpsertTrackerRecordUseCase } from '@use-cases/tracker-records/upsert-tracker-record'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { recordResponseSchema, toResponse } from './record-response'

export function putTrackerRecordRoute(
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put(
      '/tracker/records',
      {
        schema: {
          tags: ['TrackerRecords'],
          summary: 'Upsert tracker record (idempotent)',
          body: z.object({
            habitId: z.string(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            completed: z.boolean(),
            energy: z.enum(['low', 'medium', 'high']).nullable().optional(),
            quality: z.enum(['weak', 'ok', 'strong']).nullable().optional(),
            note: z.string().max(500).nullable().optional(),
          }),
          response: {
            200: z.object({ record: recordResponseSchema }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { habitId, date, completed, energy, quality, note } = request.body
        const useCase = new UpsertTrackerRecordUseCase(
          trackerRecordsRepository,
          trackerHabitsRepository,
        )
        try {
          const { record } = await useCase.execute({
            userId,
            habitId,
            date,
            completed,
            energy: energy ?? null,
            quality: quality ?? null,
            note: note ?? null,
          })
          return reply.status(200).send({ record: toResponse(record) })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          const message = error instanceof Error ? error.message : 'Erro'
          return reply.status(400).send({ message })
        }
      },
    )
  }
}
