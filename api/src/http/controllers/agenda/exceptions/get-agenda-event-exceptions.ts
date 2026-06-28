import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchAgendaEventExceptionsUseCase } from '@use-cases/agenda/exceptions/fetch-agenda-event-exceptions'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import {
  agendaEventExceptionResponseSchema,
  toExceptionResponse,
} from '../events/agenda-events-response'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function getAgendaEventExceptionsRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/events/:id/exceptions', {
      schema: {
        tags: ['Agenda'],
        summary: 'List event exceptions',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            exceptions: agendaEventExceptionResponseSchema.array(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new FetchAgendaEventExceptionsUseCase(
          agendaEventsRepository,
          agendaEventExceptionsRepository,
        )
        const { exceptions } = await useCase.execute({
          userId,
          eventId: id,
        })
        return reply
          .status(200)
          .send({ exceptions: exceptions.map(toExceptionResponse) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
