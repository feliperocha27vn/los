import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteAgendaEventExceptionUseCase } from '@use-cases/agenda/exceptions/delete-agenda-event-exception'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function deleteAgendaEventExceptionRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/agenda/events/:id/exceptions/:exceptionId', {
      schema: {
        tags: ['Agenda'],
        summary: 'Delete event exception (restore original occurrence)',
        params: z.object({ id: z.string(), exceptionId: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id, exceptionId } = request.params
        const useCase = new DeleteAgendaEventExceptionUseCase(
          agendaEventsRepository,
          agendaEventExceptionsRepository,
        )
        await useCase.execute({ userId, eventId: id, exceptionId })
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
