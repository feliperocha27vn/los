import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateAgendaEventUseCase } from '@use-cases/agenda/events/update-agenda-event'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import {
  agendaEventResponseSchema,
  toEventResponse,
} from './agenda-events-response'
import { agendaEventRecurrenceSchema } from './agenda-events-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function putAgendaEventRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/agenda/events/:id', {
      schema: {
        tags: ['Agenda'],
        summary: 'Update agenda event (affects all occurrences)',
        params: z.object({ id: z.string() }),
        body: z
          .object({
            title: z.string().min(1).max(200).optional(),
            description: z.string().max(2000).nullable().optional(),
            location: z.string().max(200).nullable().optional(),
            calendarId: z.string().optional(),
            startAt: z.string().datetime().optional(),
            endAt: z.string().datetime().optional(),
            allDay: z.boolean().optional(),
            recurrence: agendaEventRecurrenceSchema.optional(),
            recurrenceInterval: z.number().int().min(1).max(12).optional(),
            recurrenceCount: z.number().int().min(1).max(365).nullable().optional(),
            recurrenceEndsAt: z.string().datetime().nullable().optional(),
          })
          .refine(
            (b) =>
              b.title !== undefined ||
              b.description !== undefined ||
              b.location !== undefined ||
              b.calendarId !== undefined ||
              b.startAt !== undefined ||
              b.endAt !== undefined ||
              b.allDay !== undefined ||
              b.recurrence !== undefined ||
              b.recurrenceInterval !== undefined ||
              b.recurrenceCount !== undefined ||
              b.recurrenceEndsAt !== undefined,
            { message: 'Pelo menos um campo deve ser fornecido' },
          ),
        response: {
          200: z.object({ event: agendaEventResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const body = request.body
        const useCase = new UpdateAgendaEventUseCase(
          agendaEventsRepository,
          agendaCalendarsRepository,
        )
        const { event } = await useCase.execute({
          userId,
          eventId: id,
          title: body.title,
          description: body.description,
          location: body.location,
          calendarId: body.calendarId,
          startAt: body.startAt ? new Date(body.startAt) : undefined,
          endAt: body.endAt ? new Date(body.endAt) : undefined,
          allDay: body.allDay,
          recurrence: body.recurrence,
          recurrenceInterval: body.recurrenceInterval,
          recurrenceCount: body.recurrenceCount,
          recurrenceEndsAt: body.recurrenceEndsAt
            ? new Date(body.recurrenceEndsAt)
            : undefined,
        })
        return reply.status(200).send({ event: toEventResponse(event) })
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
