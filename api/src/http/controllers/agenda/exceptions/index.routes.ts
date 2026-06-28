import type { FastifyInstance } from 'fastify'
import { getAgendaEventExceptionsRoute } from './get-agenda-event-exceptions'
import { postAgendaEventExceptionRoute } from './post-agenda-event-exception'
import { deleteAgendaEventExceptionRoute } from './delete-agenda-event-exception'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function registerAgendaExceptionsRoutes(
  app: FastifyInstance,
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
): void {
  app
    .register(
      getAgendaEventExceptionsRoute(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
      ),
    )
    .register(
      postAgendaEventExceptionRoute(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
      ),
    )
    .register(
      deleteAgendaEventExceptionRoute(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
      ),
    )
}
