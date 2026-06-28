import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateAgendaCalendarUseCase } from '@use-cases/agenda/calendars/update-agenda-calendar'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import {
  agendaCalendarResponseSchema,
  toCalendarResponse,
} from './agenda-calendars-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

export function putAgendaCalendarRoute(
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/agenda/calendars/:id', {
      schema: {
        tags: ['Agenda'],
        summary: 'Update agenda calendar',
        params: z.object({ id: z.string() }),
        body: z
          .object({
            name: z.string().min(1).max(50).optional(),
            color: z
              .string()
              .regex(/^#[0-9a-fA-F]{6}$/)
              .optional(),
          })
          .refine(
            (b) => b.name !== undefined || b.color !== undefined,
            { message: 'Pelo menos um campo deve ser fornecido' },
          ),
        response: {
          200: z.object({ calendar: agendaCalendarResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { name, color } = request.body
        const useCase = new UpdateAgendaCalendarUseCase(
          agendaCalendarsRepository,
        )
        const { calendar } = await useCase.execute({
          userId,
          calendarId: id,
          name,
          color,
        })
        return reply
          .status(200)
          .send({ calendar: toCalendarResponse(calendar) })
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
