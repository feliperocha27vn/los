import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateAgendaEventStatusUseCase } from '@use-cases/agenda/events/update-agenda-event-status'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { agendaEventStatusSchema } from './agenda-events-response'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function patchAgendaEventStatusRoute(
  agendaEventsRepository: AgendaEventsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch('/agenda/events/:id/status', {
      schema: {
        tags: ['Agenda'],
        summary: 'Update agenda event status',
        params: z.object({ id: z.string() }),
        body: z.object({ status: agendaEventStatusSchema }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string(),
              status: agendaEventStatusSchema,
              updatedAt: z.string(),
            }),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { status } = request.body
        const useCase = new UpdateAgendaEventStatusUseCase(
          agendaEventsRepository,
        )
        const { event } = await useCase.execute({
          userId,
          eventId: id,
          status,
        })
        return reply.status(200).send({
          event: {
            id: event.id,
            status: event.status,
            updatedAt: event.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
