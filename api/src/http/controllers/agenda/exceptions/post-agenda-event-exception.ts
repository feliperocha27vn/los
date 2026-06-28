import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateAgendaEventExceptionUseCase } from '@use-cases/agenda/exceptions/create-agenda-event-exception'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { AgendaExceptionAlreadyExistsError } from '@errors/agenda-exception-already-exists-error'
import {
  agendaEventExceptionResponseSchema,
  toExceptionResponse,
} from '../events/agenda-events-response'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function postAgendaEventExceptionRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/agenda/events/:id/exceptions', {
      schema: {
        tags: ['Agenda'],
        summary: 'Create event exception (cancel or reschedule occurrence)',
        params: z.object({ id: z.string() }),
        body: z.object({
          originalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          action: z.enum(['cancel', 'reschedule']),
          newStartsAt: z.string().datetime().optional(),
          newEndsAt: z.string().datetime().optional(),
        }),
        response: {
          201: z.object({ exception: agendaEventExceptionResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const body = request.body
        const useCase = new CreateAgendaEventExceptionUseCase(
          agendaEventsRepository,
          agendaEventExceptionsRepository,
        )
        const { exception } = await useCase.execute({
          userId,
          eventId: id,
          originalDate: body.originalDate,
          action: body.action,
          newStartsAt: body.newStartsAt ? new Date(body.newStartsAt) : null,
          newEndsAt: body.newEndsAt ? new Date(body.newEndsAt) : null,
        })
        return reply
          .status(201)
          .send({ exception: toExceptionResponse(exception) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        if (error instanceof AgendaExceptionAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
