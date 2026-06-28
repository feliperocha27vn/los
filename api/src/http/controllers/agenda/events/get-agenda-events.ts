import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchAgendaEventsUseCase } from '@use-cases/agenda/events/fetch-agenda-events'
import {
  agendaEventExpandedResponseSchema,
  agendaEventStatusSchema,
  toExpandedEventResponse,
} from './agenda-events-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function getAgendaEventsRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/events', {
      schema: {
        tags: ['Agenda'],
        summary: 'List events with expanded recurrences',
        querystring: z.object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          calendarIds: z.string().optional(),
          status: agendaEventStatusSchema.optional(),
        }),
        response: {
          200: z.object({
            events: z.array(
              agendaEventExpandedResponseSchema.extend({
                recurrence: z.string(),
              }),
            ),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { from, to, calendarIds, status } = request.query

      const useCase = new FetchAgendaEventsUseCase(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
        agendaCalendarsRepository,
      )
      const { events } = await useCase.execute({
        userId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        calendarIds: calendarIds ? calendarIds.split(',') : undefined,
        status,
      })
      return reply.status(200).send({ events: events.map(toExpandedEventResponse) })
    })
  }
}
