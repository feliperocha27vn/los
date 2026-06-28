import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateAgendaCalendarUseCase } from '@use-cases/agenda/calendars/create-agenda-calendar'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { AgendaCalendarLimitExceededError } from '@errors/agenda-calendar-limit-exceeded-error'
import {
  agendaCalendarResponseSchema,
  toCalendarResponse,
} from './agenda-calendars-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

export function postAgendaCalendarRoute(
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/agenda/calendars', {
      schema: {
        tags: ['Agenda'],
        summary: 'Create agenda calendar',
        body: z.object({
          name: z.string().min(1).max(50),
          color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        }),
        response: {
          201: z.object({ calendar: agendaCalendarResponseSchema }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { name, color } = request.body
        const useCase = new CreateAgendaCalendarUseCase(
          agendaCalendarsRepository,
        )
        const { calendar } = await useCase.execute({ userId, name, color })
        return reply.status(201).send({ calendar: toCalendarResponse(calendar) })
      } catch (error) {
        if (error instanceof AgendaCalendarLimitExceededError) {
          return reply.status(400).send({ message: error.message })
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(400).send({ message: error.message })
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
