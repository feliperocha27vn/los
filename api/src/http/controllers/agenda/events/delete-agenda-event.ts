import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteAgendaEventUseCase } from '@use-cases/agenda/events/delete-agenda-event'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function deleteAgendaEventRoute(
  agendaEventsRepository: AgendaEventsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/agenda/events/:id', {
      schema: {
        tags: ['Agenda'],
        summary: 'Delete agenda event (entire recurring series)',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new DeleteAgendaEventUseCase(agendaEventsRepository)
        await useCase.execute({ userId, eventId: id })
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
