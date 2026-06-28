import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetAgendaCalendarDetailUseCase } from '@use-cases/agenda/calendars/get-agenda-calendar-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import {
  agendaCalendarResponseSchema,
  toCalendarResponse,
} from './agenda-calendars-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

export function getAgendaCalendarDetailRoute(
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/calendars/:id', {
      schema: {
        tags: ['Agenda'],
        summary: 'Get agenda calendar detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ calendar: agendaCalendarResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetAgendaCalendarDetailUseCase(
          agendaCalendarsRepository,
        )
        const { calendar } = await useCase.execute({
          userId,
          calendarId: id,
        })
        if (!calendar) {
          return reply.status(404).send({ message: 'Recurso não encontrado' })
        }
        return reply
          .status(200)
          .send({ calendar: toCalendarResponse(calendar) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
