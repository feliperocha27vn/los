import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import { DeleteTrackerRecordUseCase } from '@use-cases/tracker-records/delete-tracker-record'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function deleteTrackerRecordRoute(
  trackerRecordsRepository: TrackerRecordsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete(
      '/tracker/records/:id',
      {
        schema: {
          tags: ['TrackerRecords'],
          summary: 'Delete tracker record',
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
          const useCase = new DeleteTrackerRecordUseCase(trackerRecordsRepository)
          await useCase.execute({ recordId: id, userId })
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
