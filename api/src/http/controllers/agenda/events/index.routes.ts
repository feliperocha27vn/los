import type { FastifyInstance } from 'fastify'
import { getAgendaEventsRoute } from './get-agenda-events'
import { postAgendaEventRoute } from './post-agenda-event'
import { getAgendaEventDetailRoute } from './get-agenda-event-detail'
import { putAgendaEventRoute } from './put-agenda-event'
import { patchAgendaEventStatusRoute } from './patch-agenda-event-status'
import { deleteAgendaEventRoute } from './delete-agenda-event'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'

export function registerAgendaEventsRoutes(
  app: FastifyInstance,
  agendaEventsRepository: AgendaEventsRepository,
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): void {
  app
    .register(
      getAgendaEventsRoute(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
        agendaCalendarsRepository,
      ),
    )
    .register(
      postAgendaEventRoute(
        agendaEventsRepository,
        agendaCalendarsRepository,
      ),
    )
    .register(
      getAgendaEventDetailRoute(
        agendaEventsRepository,
        agendaEventExceptionsRepository,
        agendaCalendarsRepository,
      ),
    )
    .register(
      putAgendaEventRoute(agendaEventsRepository, agendaCalendarsRepository),
    )
    .register(patchAgendaEventStatusRoute(agendaEventsRepository))
    .register(deleteAgendaEventRoute(agendaEventsRepository))
}
