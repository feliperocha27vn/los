import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchAgendaCalendarsUseCase } from '@use-cases/agenda/calendars/fetch-agenda-calendars'
import {
  agendaCalendarResponseSchema,
  toCalendarResponse,
} from './agenda-calendars-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

export function getAgendaCalendarsRoute(
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/calendars', {
      schema: {
        tags: ['Agenda'],
        summary: 'List agenda calendars',
        response: {
          200: z.object({
            calendars: agendaCalendarResponseSchema.array(),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const useCase = new FetchAgendaCalendarsUseCase(
        agendaCalendarsRepository,
      )
      const { calendars } = await useCase.execute({ userId })
      return reply
        .status(200)
        .send({ calendars: calendars.map(toCalendarResponse) })
    })
  }
}
