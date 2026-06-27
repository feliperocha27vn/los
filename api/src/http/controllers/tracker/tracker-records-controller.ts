import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpsertTrackerRecordUseCase } from '@use-cases/tracker-records/upsert-tracker-record'
import { DeleteTrackerRecordUseCase } from '@use-cases/tracker-records/delete-tracker-record'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'

const recordResponseSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  completed: z.boolean(),
  energy: z.enum(['low', 'medium', 'high']).nullable(),
  quality: z.enum(['weak', 'ok', 'strong']).nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toResponse(record: {
  id: string
  habitId: string
  date: string
  completed: boolean
  energy: 'low' | 'medium' | 'high' | null
  quality: 'weak' | 'ok' | 'strong' | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    habitId: record.habitId,
    date: record.date,
    completed: record.completed,
    energy: record.energy,
    quality: record.quality,
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeTrackerRecordsController(
  trackerRecordsRepository: TrackerRecordsRepository,
  trackerHabitsRepository: TrackerHabitsRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/tracker/records', {
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
    }, async (request, reply) => {
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
    })

    app.delete('/tracker/records/:id', {
      schema: {
        tags: ['TrackerRecords'],
        summary: 'Delete tracker record',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new DeleteTrackerRecordUseCase(trackerRecordsRepository)
        await useCase.execute({ recordId: id, userId })
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
