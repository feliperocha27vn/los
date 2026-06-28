import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetAgendaEventDetailUseCase } from '@use-cases/agenda/events/get-agenda-event-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import {
  agendaEventExceptionResponseSchema,
  agendaEventResponseSchema,
  toEventResponse,
  toExceptionResponse,
} from './agenda-events-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function getAgendaEventDetailRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/events/:id', {
      schema: {
        tags: ['Agenda'],
        summary: 'Get agenda event detail with exceptions',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            event: agendaEventResponseSchema,
            exceptions: agendaEventExceptionResponseSchema.array(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetAgendaEventDetailUseCase(
          agendaEventsRepository,
          agendaEventExceptionsRepository,
          agendaCalendarsRepository,
        )
        const { event, exceptions } = await useCase.execute({
          userId,
          eventId: id,
        })
        if (!event) {
          return reply.status(404).send({ message: 'Recurso não encontrado' })
        }
        return reply.status(200).send({
          event: toEventResponse(event),
          exceptions: exceptions.map(toExceptionResponse),
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
