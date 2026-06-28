import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateAgendaEventUseCase } from '@use-cases/agenda/events/create-agenda-event'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { AgendaEventLimitExceededError } from '@errors/agenda-event-limit-exceeded-error'
import {
  agendaEventResponseSchema,
  toEventResponse,
} from './agenda-events-response'
import { agendaEventRecurrenceSchema } from './agenda-events-response'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function postAgendaEventRoute(
  agendaEventsRepository: AgendaEventsRepository,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/agenda/events', {
      schema: {
        tags: ['Agenda'],
        summary: 'Create agenda event',
        body: z.object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).nullable().optional(),
          location: z.string().max(200).nullable().optional(),
          calendarId: z.string(),
          startAt: z.string().datetime(),
          endAt: z.string().datetime(),
          allDay: z.boolean().optional(),
          recurrence: agendaEventRecurrenceSchema.optional(),
          recurrenceInterval: z.number().int().min(1).max(12).optional(),
          recurrenceCount: z.number().int().min(1).max(365).nullable().optional(),
          recurrenceEndsAt: z.string().datetime().nullable().optional(),
        }),
        response: {
          201: z.object({ event: agendaEventResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const body = request.body
        const useCase = new CreateAgendaEventUseCase(
          agendaEventsRepository,
          agendaCalendarsRepository,
        )
        const { event } = await useCase.execute({
          userId,
          title: body.title,
          description: body.description ?? null,
          location: body.location ?? null,
          calendarId: body.calendarId,
          startAt: new Date(body.startAt),
          endAt: new Date(body.endAt),
          allDay: body.allDay,
          recurrence: body.recurrence,
          recurrenceInterval: body.recurrenceInterval,
          recurrenceCount: body.recurrenceCount,
          recurrenceEndsAt: body.recurrenceEndsAt
            ? new Date(body.recurrenceEndsAt)
            : null,
        })
        return reply.status(201).send({ event: toEventResponse(event) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        if (error instanceof AgendaEventLimitExceededError) {
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
